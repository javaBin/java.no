import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, useWatch, type Control } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import nextI18nConfig from "../../next-i18next.config.mjs"
import { generatePDF } from "@/lib/pdf"
import { CalendarIcon, Trash2, Mail, Plus } from "lucide-react"
import { createExpenseSchemas } from "@/lib/expense"
import { BankDetailsForm } from "@/components/BankDetailsForm"
import { getBankCountryType } from "@/lib/expense"
import { FileUploader } from "@/components/FileUploader"
import { Toaster } from "sonner"
import { format } from "date-fns"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useTranslation } from "next-i18next"
import { nb } from "date-fns/locale"
import type { GetServerSideProps } from "next"
import { Country, CountryDropdown } from "@/components/ui/country-dropdown"
import { CurrencyDropdown } from "@/components/ui/currency-dropdown"
import { getSymbolFromCurrency, countries } from "country-data-list"

function getString(
  query: Record<string, string | string[] | undefined>,
  key: string,
  defaultValue: string = "",
): string {
  const value = query[key]
  if (value === undefined || value === null) return defaultValue
  if (Array.isArray(value)) return value[0] ?? defaultValue
  return value ?? defaultValue
}

function parseFormQueryParams(
  query: Record<string, string | string[] | undefined>,
) {
  const isInternationalBank =
    getString(query, "isInternationalBank", "false") === "true"
  const country = getString(query, "country", "Norway")
  const residesInNorway =
    getString(query, "residesInNorway", "") === ""
      ? !isInternationalBank && country === "Norway"
      : getString(query, "residesInNorway", "true") === "true"

  return {
    name: getString(query, "name", ""),
    email: getString(query, "email", ""),
    streetAddress: getString(query, "streetAddress", ""),
    postalCode: getString(query, "postalCode", ""),
    city: getString(query, "city", ""),
    country,
    residesInNorway,
    bankCountry: getString(
      query,
      "bankCountry",
      residesInNorway ? "Norway" : "",
    ),
    bankCountryIso2: getString(
      query,
      "bankCountryIso2",
      residesInNorway ? "NO" : "",
    ),
    bankIban: getString(query, "bankIban", getString(query, "bankAccount", "")),
    bankRoutingNumber: getString(query, "bankRoutingNumber", ""),
    bankAccountNumber: getString(query, "bankAccountNumber", ""),
    bankAccountType: getString(query, "bankAccountType", "checking"),
    bankSwiftBic: getString(query, "bankSwiftBic", ""),
    bankName: getString(query, "bankName", ""),
    bankAddress: getString(query, "bankAddress", ""),
    bankAccountHolderName: getString(query, "bankAccountHolderName", ""),
  }
}

type InitialFormValues = ReturnType<typeof parseFormQueryParams>

type ExpensePageProps = {
  initialFormValues: InitialFormValues
}

type ExpenseAmountInputProps = {
  control: Control<any>
  name: `expenses.${number}.amount`
  currencyName: `expenses.${number}.currency`
  label: string
  /** Locale for formatting (e.g. from selected country). Falls back to browser language. */
  displayLocale?: string
}

function formatAmountDisplay(value: number, locale: string): string {
  if (value === 0) return ""
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return formatter.format(value)
}

function parseAmountInput(raw: string): number {
  const trimmed = raw.trim().replace(/\s/g, "")
  if (trimmed === "" || trimmed === "." || trimmed === ",") return 0

  const lastComma = trimmed.lastIndexOf(",")
  const lastPeriod = trimmed.lastIndexOf(".")

  let normalized: string
  if (lastComma > lastPeriod) {
    // Comma is decimal separator (e.g. European "99.999,00")
    normalized = trimmed.replace(/\./g, "").replace(",", ".")
  } else if (lastPeriod > lastComma) {
    // Period is decimal separator (e.g. US "99,999.00")
    normalized = trimmed.replace(/,/g, "")
  } else {
    normalized = trimmed.replace(",", ".")
  }

  const num = parseFloat(normalized)
  if (Number.isNaN(num) || num < 0) return 0
  return Math.round(num * 100) / 100
}

function ExpenseAmountInput({
  control,
  name,
  currencyName,
  label,
  displayLocale: displayLocaleProp,
}: ExpenseAmountInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [localValue, setLocalValue] = useState("")

  const selectedCurrencyCode = useWatch({ control, name: currencyName })
  const symbol =
    selectedCurrencyCode && typeof selectedCurrencyCode === "string"
      ? getSymbolFromCurrency(selectedCurrencyCode)
      : ""

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const displayLocale =
          displayLocaleProp ||
          (typeof navigator !== "undefined" ? navigator.language : "en-GB")
        const displayValue = isFocused
          ? localValue
          : formatAmountDisplay(field.value ?? 0, displayLocale)

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="relative w-full">
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  {...field}
                  value={displayValue}
                  disabled={!selectedCurrencyCode}
                  onChange={(e) => {
                    setLocalValue(e.target.value)
                    field.onChange(parseAmountInput(e.target.value))
                  }}
                  onFocus={() => {
                    setIsFocused(true)
                    setLocalValue(
                      field.value != null && field.value !== 0
                        ? formatAmountDisplay(field.value, displayLocale)
                        : "",
                    )
                  }}
                  onBlur={() => {
                    const parsed = parseAmountInput(localValue)
                    field.onChange(parsed)
                    setLocalValue("")
                    setIsFocused(false)
                    field.onBlur()
                  }}
                  ref={field.ref}
                  name={field.name}
                  className="pr-10"
                />
              </FormControl>
              {symbol ? (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {symbol}
                </span>
              ) : null}
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

export default function ExpensePage({ initialFormValues }: ExpensePageProps) {
  const { t, i18n } = useTranslation("common")

  const { formSchema } = createExpenseSchemas(t, i18n.language)
  type FormValues = z.infer<typeof formSchema>

  const [isLoading, setIsLoading] = useState(false)
  const [skipAccountValidation, setSkipAccountValidation] = useState(false)
  const [accountValidationFailed, setAccountValidationFailed] = useState(false)
  const [accountValidationResult, setAccountValidationResult] = useState<{
    errorType?: "country" | "length" | "format" | "unknown"
    expectedLength?: number
    actualLength?: number
    countryName?: string
  } | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialFormValues.name,
      streetAddress: initialFormValues.streetAddress,
      postalCode: initialFormValues.postalCode,
      city: initialFormValues.city,
      country: initialFormValues.country,
      residesInNorway: initialFormValues.residesInNorway,
      bankCountry: initialFormValues.bankCountry,
      bankCountryIso2: initialFormValues.bankCountryIso2,
      bankIban: initialFormValues.bankIban,
      bankRoutingNumber: initialFormValues.bankRoutingNumber,
      bankAccountNumber: initialFormValues.bankAccountNumber,
      bankAccountType:
        (initialFormValues.bankAccountType as "checking" | "savings") ||
        "checking",
      bankSwiftBic: initialFormValues.bankSwiftBic,
      bankName: initialFormValues.bankName,
      bankAddress: initialFormValues.bankAddress,
      bankAccountHolderName: initialFormValues.bankAccountHolderName,
      email: initialFormValues.email,
      expenses: [
        {
          description: "",
          amount: 0,
          currency: "NOK",
          date: new Date(),
          attachment: undefined as unknown as File,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "expenses",
  })

  const residesInNorway = form.watch("residesInNorway")

  const handleResidenceChange = (value: string) => {
    const isNorway = value === "norway"
    form.setValue("residesInNorway", isNorway)

    if (isNorway) {
      form.setValue("country", "Norway")
      form.setValue("bankCountry", "")
      form.setValue("bankCountryIso2", "")
      form.setValue("bankIban", "")
      form.setValue("bankRoutingNumber", "")
      form.setValue("bankSwiftBic", "")
      form.setValue("bankName", "")
      form.setValue("bankAddress", "")
      form.setValue("bankAccountHolderName", "")
    } else {
      form.setValue("country", "")
      form.setValue("bankAccountNumber", "")
    }

    setAccountValidationFailed(false)
    setSkipAccountValidation(false)
    setAccountValidationResult(null)
  }

  const watchedBankIban = form.watch("bankIban")
  const watchedBankCountryIso2 = form.watch("bankCountryIso2")
  const watchedCountry = form.watch("country")
  const amountDisplayLocale = React.useMemo(() => {
    if (watchedCountry) {
      const countryData = countries.all.find(
        (c: any) => c.name === watchedCountry,
      )
      if (
        countryData &&
        countryData.alpha2 &&
        countryData.languages &&
        countryData.languages.length > 0
      ) {
        return `${countryData.languages[0]}-${countryData.alpha2}`
      }
    }
    return typeof navigator !== "undefined" ? navigator.language : "en-GB"
  }, [watchedCountry])
  const bankCountryType = getBankCountryType(watchedBankCountryIso2 || "")

  React.useEffect(() => {
    if (accountValidationFailed && watchedBankIban) {
      const hasSpaces = watchedBankIban.includes(" ")
      if (!hasSpaces) {
        setAccountValidationFailed(false)
        setSkipAccountValidation(false)
      }
    }
  }, [watchedBankIban, accountValidationFailed])

  const prevBankIbanRef = React.useRef(watchedBankIban)
  React.useEffect(() => {
    if (prevBankIbanRef.current !== watchedBankIban) {
      prevBankIbanRef.current = watchedBankIban
      setSkipAccountValidation(false)
    }
  }, [watchedBankIban])

  const isDirty = form.formState.isDirty
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  const onSubmit = async (data: FormValues) => {
    if (skipAccountValidation) {
      form.clearErrors("bankIban")
    }

    setIsLoading(true)
    try {
      const expenseReport = await generatePDF({
        name: data.name,
        streetAddress: data.streetAddress,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
        residesInNorway: data.residesInNorway,
        bankCountry: data.bankCountry,
        bankCountryIso2: data.bankCountryIso2,
        bankIban: data.bankIban,
        bankRoutingNumber: data.bankRoutingNumber,
        bankAccountNumber: data.bankAccountNumber,
        bankAccountType: data.bankAccountType,
        bankSwiftBic: data.bankSwiftBic,
        bankName: data.bankName,
        bankAddress: data.bankAddress,
        bankAccountHolderName: data.bankAccountHolderName,
        email: data.email,
        expenses: data.expenses,
        validationSkipped: skipAccountValidation,
      })

      const blob = new Blob([expenseReport as BlobPart], {
        type: "application/pdf",
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url

      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]
      const sanitizedName = data.name
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()

      link.setAttribute(
        "download",
        `${todayStr}-${sanitizedName}-expense-report.pdf`,
      )
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resizeImage = async (
    file: File,
    options: { maxWidth: number; maxHeight: number; quality: number },
  ): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = URL.createObjectURL(file)

      img.onload = () => {
        const canvas = document.createElement("canvas")
        let { width, height } = img

        if (width > options.maxWidth) {
          height = (height * options.maxWidth) / width
          width = options.maxWidth
        }
        if (height > options.maxHeight) {
          width = (width * options.maxHeight) / height
          height = options.maxHeight
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg" }))
            }
          },
          "image/jpeg",
          options.quality,
        )

        URL.revokeObjectURL(img.src)
      }
    })
  }

  const getValidationErrorMessage = () => {
    if (residesInNorway) {
      return t("expense.invalidNorwegianAccountDetail")
    }

    if (bankCountryType === "sepa") {
      if (accountValidationResult?.errorType === "format") {
        return accountValidationResult.countryName
          ? t("expense.invalidIbanFormat", {
              countryName: accountValidationResult.countryName,
            })
          : t("expense.invalidIbanFormatGeneric")
      }
      if (accountValidationResult?.errorType === "length") {
        return accountValidationResult.countryName
          ? t("expense.invalidIbanLength", {
              expectedLength: accountValidationResult.expectedLength,
              actualLength: accountValidationResult.actualLength,
              countryName: accountValidationResult.countryName,
            })
          : t("expense.invalidIbanLengthGeneric", {
              expectedLength: accountValidationResult.expectedLength,
              actualLength: accountValidationResult.actualLength,
            })
      }
      return (
        t("expense.invalidAccountGeneric") +
        " " +
        t("expense.validationOverridePrompt")
      )
    }

    return null
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {t("expense.title")}
        </h1>
        <p className="mt-2 text-base text-gray-500">{t("expense.subtitle")}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Residence toggle */}
          <Tabs
            value={residesInNorway ? "norway" : "abroad"}
            onValueChange={handleResidenceChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="norway">
                {t("expense.residesInNorway")}
              </TabsTrigger>
              <TabsTrigger value="abroad">
                {t("expense.residesAbroad")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Bank details */}
          <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-5">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("expense.bankAccount")}
            </h2>
            <p className="mb-4 mt-1 text-sm text-gray-500">
              {residesInNorway
                ? t("expense.bankDescriptionNorwegian")
                : t("expense.bankDescriptionInternational")}
            </p>

            <BankDetailsForm
              form={form}
              t={t}
              language={i18n.language}
              isInternational={!residesInNorway}
              onValidationChange={(result) => {
                setAccountValidationFailed(!result.isValid)
                setAccountValidationResult(
                  result.isValid
                    ? null
                    : {
                        errorType: result.errorType,
                        expectedLength: result.expectedLength,
                        actualLength: result.actualLength,
                        countryName: result.countryName,
                      },
                )
              }}
            />

            {accountValidationFailed && !skipAccountValidation && (
              <p className="mt-3 text-sm text-red-600">
                {getValidationErrorMessage()}
              </p>
            )}

            {accountValidationFailed && (
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-gray-500">
                <input
                  type="checkbox"
                  checked={skipAccountValidation}
                  onChange={(e) => {
                    setSkipAccountValidation(e.target.checked)
                    if (e.target.checked) {
                      if (!residesInNorway) {
                        form.clearErrors("bankIban")
                      } else {
                        form.clearErrors("bankAccountNumber")
                      }
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                {t("expense.skipValidationLabel")}
              </label>
            )}
          </section>

          {/* Personal information */}
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t("expense.personalInfo")}
            </h2>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("expense.name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("expense.namePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("expense.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("expense.emailPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("expense.address")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("expense.addressPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("expense.postalCode")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("expense.postalCodePlaceholder")}
                          {...field}
                          onChange={(e) => {
                            const value = residesInNorway
                              ? e.target.value.replace(/\D/g, "")
                              : e.target.value
                            field.onChange(value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("expense.city")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("expense.cityPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!residesInNorway && (
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("expense.country")}</FormLabel>
                      <FormControl>
                        <CountryDropdown
                          {...field}
                          defaultValue={field.value}
                          onChange={(country: Country) => {
                            form.setValue(field.name, country?.alpha3 || "")
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </section>

          {/* Expenses */}
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t("expense.expenses")}
            </h2>

            <div className="space-y-5">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className={cn(
                    "relative space-y-3 rounded-lg bg-gray-50 p-4",
                    index > 0 && "border-t border-gray-100",
                  )}
                >
                  {fields.length > 1 && (
                    <div className="absolute right-3 top-3 z-10">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="gap-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name={`expenses.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("expense.description")}</FormLabel>
                        <FormDescription>
                          {t("expense.descriptionDescription")}
                        </FormDescription>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("expense.descriptionPlaceholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-[auto_1fr_auto]">
                    <FormField
                      control={form.control}
                      name={`expenses.${index}.date`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("expense.date")}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", {
                                      locale:
                                        i18n.language === "no" ? nb : undefined,
                                    })
                                  ) : (
                                    <span>{t("expense.selectDate")}</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                locale={i18n.language === "no" ? nb : undefined}
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("2020-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <ExpenseAmountInput
                      control={form.control}
                      name={`expenses.${index}.amount`}
                      currencyName={`expenses.${index}.currency`}
                      label={t("expense.amount")}
                      displayLocale={amountDisplayLocale}
                    />

                    <FormField
                      control={form.control}
                      name={`expenses.${index}.currency`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("expense.currency")}</FormLabel>
                          <FormControl>
                            <CurrencyDropdown
                              slim={true}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder={t("expense.selectCurrency")}
                              currencies="custom"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`expenses.${index}.attachment`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("expense.attachment")}</FormLabel>
                        <FormControl>
                          <FileUploader
                            onUpload={async (files) => {
                              const file = files[0]
                              if (!file) {
                                field.onChange(undefined)
                                return
                              }

                              if (file.type.startsWith("image/")) {
                                const resizedFile = await resizeImage(file, {
                                  maxWidth: 1800,
                                  maxHeight: 1800,
                                  quality: 0.8,
                                })
                                field.onChange(resizedFile)
                              } else {
                                field.onChange(file)
                              }
                            }}
                            accept={{
                              "image/*": [],
                              "application/pdf": [],
                            }}
                            maxSize={10 * 1024 * 1024}
                            {...field}
                            value={field.value?.size > 0 ? [field.value] : []}
                            onValueChange={(files) => {
                              const file = files?.[0]
                              field.onChange(
                                file && file?.size > 0 ? file : undefined,
                              )
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            {fields.length > 0 && (
              <div className="flex justify-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      description: "",
                      amount: 0,
                      currency: "NOK",
                      date: new Date(),
                      attachment: new File([], ""),
                    })
                  }
                  className="gap-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                  {t("expense.addExpense")}
                </Button>
              </div>
            )}
          </section>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 px-6 text-white hover:bg-blue-700"
            >
              {isLoading
                ? t("expense.processing")
                : t("expense.generateReport")}
            </Button>
            <Button
              type="button"
              variant="outline"
              asChild
              className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <a
                target="_blank"
                href={`mailto:faktura@java.no?subject=Utlegg ${form.getValues("expenses")[0]?.date?.toLocaleDateString("sv") || new Date().toLocaleDateString("sv")} - ${form.getValues("name")}&body=${encodeURIComponent(`Hei, jeg har gjort utlegg for ${form
                  .getValues("expenses")
                  .map((expense) => expense.description)
                  .join(", ")}.

Vedlagt er en PDF-fil med utleggene.

Med vennlig hilsen,
${form.getValues("name")}`)}`}
              >
                <Mail className="h-4 w-4" />
                {t("expense.sendEmail")}
              </a>
            </Button>
          </div>
        </form>
      </Form>
      <Toaster />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { query, locale } = context
  const initialFormValues = parseFormQueryParams(query)

  return {
    props: {
      initialFormValues,
      ...(await serverSideTranslations(
        locale ?? "no",
        ["common"],
        nextI18nConfig,
        ["no", "en"],
      )),
    },
  }
}
