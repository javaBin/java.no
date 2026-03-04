"use client"

import React, { useEffect, useState } from "react"
import { UseFormReturn, useWatch } from "react-hook-form"
import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  IbanAccountInput,
  NorwegianAccountInput,
  type AccountValidationResult,
} from "@/components/account-input"
import {
  getBankCountryType,
  validateABARoutingNumber,
  validateBIC,
} from "@/lib/expense"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Country, CountryDropdown } from "./ui/country-dropdown"

type BankDetailsFormProps = {
  form: UseFormReturn<any>
  t: (key: string, options?: Record<string, unknown>) => string
  language: string
  isInternational: boolean
}

export function BankDetailsForm({
  form,
  t,
  language,
  isInternational,
}: BankDetailsFormProps) {
  const [skipValidation, setSkipValidation] = useState(false)
  const [accountValidationFailed, setAccountValidationFailed] = useState(false)
  const [otherValidationFailed, setOtherValidationFailed] = useState(false)
  const [validationResult, setValidationResult] =
    useState<AccountValidationResult | null>(null)

  const validationFailed = accountValidationFailed || otherValidationFailed

  const bankCountryIso2 = useWatch({
    control: form.control,
    name: "bankCountryIso2",
  })
  const watchedBankIban = useWatch({
    control: form.control,
    name: "bankIban",
  })
  const watchedBankAccountNumber = useWatch({
    control: form.control,
    name: "bankAccountNumber",
  })

  const type = bankCountryIso2
    ? getBankCountryType(bankCountryIso2)
    : "sepa"
  const previousTypeRef = React.useRef(type)

  useEffect(() => {
    setSkipValidation(false)
    setAccountValidationFailed(false)
    setOtherValidationFailed(false)
    setValidationResult(null)
    form.setValue("skipBankValidation", false)
  }, [isInternational, form])

  const prevBankIbanRef = React.useRef(watchedBankIban)
  useEffect(() => {
    if (prevBankIbanRef.current !== watchedBankIban) {
      prevBankIbanRef.current = watchedBankIban
      setSkipValidation(false)
      form.setValue("skipBankValidation", false)
    }
  }, [watchedBankIban, form])

  const prevAccountNumberRef = React.useRef(watchedBankAccountNumber)
  useEffect(() => {
    if (prevAccountNumberRef.current !== watchedBankAccountNumber) {
      prevAccountNumberRef.current = watchedBankAccountNumber
      setSkipValidation(false)
      form.setValue("skipBankValidation", false)
    }
  }, [watchedBankAccountNumber, form])

  useEffect(() => {
    if (previousTypeRef.current === type) return
    previousTypeRef.current = type

    setSkipValidation(false)
    setAccountValidationFailed(false)
    setOtherValidationFailed(false)
    setValidationResult(null)
    form.setValue("skipBankValidation", false)
  }, [type, form])

  const bankCountryName = React.useMemo(() => {
    if (!bankCountryIso2) return undefined
    try {
      return new Intl.DisplayNames([language], { type: "region" }).of(
        bankCountryIso2.toUpperCase(),
      )
    } catch {
      return bankCountryIso2.toUpperCase()
    }
  }, [bankCountryIso2, language])

  const clearBankErrors = React.useCallback(() => {
    form.clearErrors("bankAccountNumber")
    form.clearErrors("bankIban")
    form.clearErrors("bankSwiftBic")
    form.clearErrors("bankRoutingNumber")
  }, [form])

  const getIbanErrorMessage = React.useCallback(
    (result: AccountValidationResult) => {
      if (result.errorType === "length" && result.expectedLength != null && result.actualLength != null) {
        return bankCountryName
          ? t("expense.invalidIbanLength", {
              expectedLength: result.expectedLength,
              actualLength: result.actualLength,
              countryName: bankCountryName,
            })
          : t("expense.invalidIbanLengthGeneric", {
              expectedLength: result.expectedLength,
              actualLength: result.actualLength,
            })
      }
      if (result.errorType === "checksum") {
        return (
          t("expense.invalidAccountGeneric") +
          " " +
          t("expense.validationOverridePrompt")
        )
      }
      return bankCountryName
        ? t("expense.invalidIbanFormat", { countryName: bankCountryName })
        : t("expense.invalidIbanFormatGeneric")
    },
    [bankCountryName, t],
  )

  const handleSkipToggle = React.useCallback(
    (checked: boolean) => {
      setSkipValidation(checked)
      form.setValue("skipBankValidation", checked)
      if (checked) {
        clearBankErrors()
      } else {
        if (accountValidationFailed && validationResult) {
          if (!isInternational) {
            form.setError("bankAccountNumber", {
              message: t("expense.invalidNorwegianAccountDetail"),
            })
          } else if (type === "sepa") {
            form.setError("bankIban", {
              message: getIbanErrorMessage(validationResult),
            })
          }
        }
        if (otherValidationFailed) {
          if (type === "sepa" || type === "us" || type === "other") {
            const swift = (form.getValues("bankSwiftBic") || "")
              .replace(/\s/g, "")
              .toUpperCase()
            if (swift && !validateBIC(swift)) {
              form.setError("bankSwiftBic", {
                message: t("expense.errors.invalidSwift"),
              })
            }
          }
          if (type === "us") {
            const routing = (form.getValues("bankRoutingNumber") || "").replace(
              /\D/g,
              "",
            )
            if (routing && !validateABARoutingNumber(routing)) {
              form.setError("bankRoutingNumber", {
                message: t("expense.errors.invalidRoutingNumber"),
              })
            }
          }
        }
      }
    },
    [
      form,
      clearBankErrors,
      accountValidationFailed,
      validationResult,
      isInternational,
      type,
      otherValidationFailed,
      getIbanErrorMessage,
      t,
    ],
  )

  const handleAccountValidationChange = React.useCallback(
    (result: AccountValidationResult) => {
      setAccountValidationFailed(!result.isValid)
      setValidationResult(result.isValid ? null : result)
    },
    [],
  )

  const swiftBicField = (
    <FormField
      control={form.control}
      name="bankSwiftBic"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("expense.bankSwiftBic")}</FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder={t("expense.bankSwiftBicPlaceholder")}
              onChange={(event) => {
                const value = event.target.value.toUpperCase()
                field.onChange(value)
              }}
              onBlur={() => {
                field.onBlur()
                const cleaned = (field.value || "")
                  .replace(/\s/g, "")
                  .toUpperCase()
                if (cleaned !== field.value) field.onChange(cleaned)
                if (skipValidation) return
                if (cleaned && !validateBIC(cleaned)) {
                  form.setError("bankSwiftBic", {
                    message: t("expense.errors.invalidSwift"),
                  })
                  setOtherValidationFailed(true)
                } else {
                  form.clearErrors("bankSwiftBic")
                  setOtherValidationFailed(false)
                }
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const skipValidationUi = validationFailed ? (
    <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-gray-500">
        <input
          type="checkbox"
          checked={skipValidation}
          onChange={(e) => handleSkipToggle(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        {t("expense.skipValidationLabel")}
    </label>
  ) : null

  if (!isInternational) {
    return (
      <>
        <FormField
          control={form.control}
          name="bankAccountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("expense.bankAccountNumber")}</FormLabel>
              <FormControl>
                <NorwegianAccountInput
                  {...field}
                  placeholder={t("expense.bankAccountNumberPlaceholder")}
                  onValidationChange={(result) => {
                    handleAccountValidationChange(result)
                    if (result.isValid) {
                      form.clearErrors("bankAccountNumber")
                    } else {
                      form.setError("bankAccountNumber", {
                        message: t("expense.invalidNorwegianAccountDetail"),
                      })
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {skipValidationUi}
      </>
    )
  }

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="bankCountry"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("expense.bankCountry")}</FormLabel>
            <FormControl>
              <CountryDropdown
                defaultValue={field.value}
                onChange={(country: Country) => {
                  const alpha3 = country?.alpha3 ?? ""
                  const alpha2 = country?.alpha2 || ""
                  field.onChange(alpha3)
                  form.setValue("bankCountryIso2", alpha2)

                  const countryState = form.getFieldState("country")
                  const hasUserTouchedCountry =
                    countryState.isTouched || countryState.isDirty
                  if (!hasUserTouchedCountry) {
                    form.setValue("country", alpha3)
                  }
                }}
                name="bankCountry"
                enableAutofill={false}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {type === "sepa" && (
        <>
          <FormField
            control={form.control}
            name="bankIban"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankIban")}</FormLabel>
                <FormControl>
                  <IbanAccountInput
                    {...field}
                    countryIso2={bankCountryIso2 || ""}
                    placeholder={t("expense.bankIbanPlaceholder")}
                    onValidationChange={(result) => {
                      handleAccountValidationChange(result)
                      if (skipValidation) return
                      if (result.isValid) {
                        form.clearErrors("bankIban")
                      } else {
                        form.setError("bankIban", {
                          message: getIbanErrorMessage(result),
                        })
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {swiftBicField}
        </>
      )}

      {type === "us" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="bankRoutingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("expense.bankRoutingNumber")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                    placeholder={t("expense.bankRoutingNumberPlaceholder")}
                      inputMode="numeric"
                      onBlur={() => {
                        field.onBlur()
                        const digits = field.value.replace(/\D/g, "")
                        if (digits !== field.value) field.onChange(digits)
                        if (skipValidation) return
                        if (digits && !validateABARoutingNumber(digits)) {
                          form.setError("bankRoutingNumber", {
                            message: t(
                              "expense.errors.invalidRoutingNumber",
                            ),
                          })
                          setOtherValidationFailed(true)
                        } else {
                          form.clearErrors("bankRoutingNumber")
                          setOtherValidationFailed(false)
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankAccountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("expense.bankAccountNumber")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                    placeholder={t("expense.bankAccountNumberUsPlaceholder")}
                      onBlur={() => {
                        field.onBlur()
                        const trimmed = field.value.trim()
                        if (trimmed !== field.value) field.onChange(trimmed)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="bankAccountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankAccountType")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="checking">
                      {t("expense.bankAccountTypeChecking")}
                    </SelectItem>
                    <SelectItem value="savings">
                      {t("expense.bankAccountTypeSavings")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {swiftBicField}
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankName")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Chase Bank" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankAddress")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("expense.bankAddressPlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankAccountHolderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankAccountHolderName")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("expense.namePlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      {type === "other" && (
        <>
          <FormField
            control={form.control}
            name="bankAccountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankAccountNumber")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("expense.bankAccountOrIbanPlaceholder")}
                    onBlur={() => {
                      field.onBlur()
                      const trimmed = field.value.trim()
                      if (trimmed !== field.value) field.onChange(trimmed)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {swiftBicField}
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankName")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankAddress")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankAccountHolderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankAccountHolderName")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("expense.namePlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      {skipValidationUi}
    </div>
  )
}
