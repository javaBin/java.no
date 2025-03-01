import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import nextI18nConfig from "../../next-i18next.config.mjs"
import { Label } from "@/components/ui/label"
import { generatePDF } from "@/lib/pdf"
import { CalendarIcon, Trash2, Eraser, Mail } from "lucide-react"
import { createExpenseSchemas } from "@/lib/expense"
import AccountInput from "@/components/AccountInput"
import { FileUploader } from "@/components/FileUploader"
import { Toaster } from "sonner"
import LocationInput from "@/components/ui/location-input"
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
import { parseAsString, useQueryStates } from "nuqs"
import type { GetStaticProps } from "next"

// BBAN: 8601 11 17947
// IBAN: NO9386011117947

export default function ExpensePage() {
  const { t, i18n } = useTranslation("common")

  // Create schema with localized error messages
  const { formSchema } = createExpenseSchemas(t, i18n.language)
  type FormValues = z.infer<typeof formSchema>

  const [isLoading, setIsLoading] = useState(false)

  const [queryParamForm, setQueryParamForm] = useQueryStates({
    name: parseAsString.withDefault(""),
    email: parseAsString.withDefault(""),
    streetAddress: parseAsString.withDefault(""),
    postalCode: parseAsString.withDefault(""),
    city: parseAsString.withDefault(""),
    country: parseAsString.withDefault("Norway"),
    bankAccount: parseAsString.withDefault(""),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: queryParamForm.name,
      streetAddress: queryParamForm.streetAddress,
      postalCode: queryParamForm.postalCode,
      city: queryParamForm.city,
      country: queryParamForm.country,
      bankAccount: queryParamForm.bankAccount,
      email: queryParamForm.email,
      date: new Date(),
      expenses: [
        {
          description: "",
          amount: 0,
          attachment: undefined as unknown as File,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "expenses",
  })

  // Handler to clear form
  const handleClearForm = () => {
    form.reset({
      name: "",
      streetAddress: "",
      postalCode: "",
      city: "",
      country: "Norway",
      bankAccount: "",
      email: "",
      date: new Date(),
      expenses: [
        {
          description: "",
          amount: 0,
          attachment: undefined as unknown as File,
        },
      ],
    })
    setQueryParamForm(null)
  }

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      const expenseReport = await generatePDF({
        name: data.name,
        streetAddress: data.streetAddress,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
        bankAccount: data.bankAccount,
        email: data.email,
        date: data.date,
        expenses: data.expenses,
      })

      const blob = new Blob([expenseReport], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute(
        "download",
        `${data.date.toISOString().split("T")[0]}-expense-report.pdf`,
      )
      // Create temporary link element to trigger download
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

  // Add this helper function for image resizing
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

  return (
    <div className="container mx-auto mt-12 py-10">
      <h1 className="mb-8 text-3xl font-bold">{t("expense.title")}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <Label>{t("expense.name")}</Label>
                  <FormControl>
                    <Input
                      placeholder={t("expense.namePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="streetAddress"
              render={({ field }) => (
                <FormItem>
                  <Label>{t("expense.address")}</Label>
                  <FormControl>
                    <Input
                      placeholder={t("expense.addressPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <Label>{t("expense.postalCode")}</Label>
                    <FormControl>
                      <Input
                        placeholder={t("expense.postalCodePlaceholder")}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <Label>{t("expense.city")}</Label>
                    <FormControl>
                      <Input
                        placeholder={t("expense.cityPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <Label>{t("expense.country")}</Label>
                  <FormControl>
                    <LocationInput
                      {...field}
                      defaultValue={field.value}
                      onCountryChange={(country) => {
                        form.setValue(field.name, country?.name || "")
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankAccount"
              render={({ field }) => (
                <FormItem>
                  <Label>{t("expense.bankAccount")}</Label>
                  <FormControl>
                    <AccountInput {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label>{t("expense.email")}</Label>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("expense.emailPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormControl>
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("expense.date")}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", {
                                locale: i18n.language === "no" ? nb : undefined,
                              })
                            ) : (
                              <span>{t("expense.selectDate")}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={i18n.language === "no" ? nb : undefined}
                          disabled={(date) =>
                            date > new Date() || date < new Date("2020-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      {t("expense.dateDescription")}
                    </FormDescription>
                    <div className="flex items-center space-x-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearForm}
                      >
                        <Eraser className="mr-2 h-4 w-4" />
                        {t("expense.clearForm")}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormControl>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t("expense.expenses")}</h2>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    description: "",
                    amount: 0,
                    attachment: new File([], ""),
                  })
                }
              >
                {t("expense.addExpense")}
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="space-y-4 rounded-lg border p-4">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name={`expenses.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <Label>{t("expense.description")}</Label>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`expenses.${index}.amount`}
                  render={({ field }) => (
                    <FormItem>
                      <Label>{t("expense.amount")}</Label>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`expenses.${index}.attachment`}
                  render={({ field }) => (
                    <FormItem>
                      <Label>{t("expense.attachment")}</Label>
                      <FormControl>
                        <FileUploader
                          onUpload={async (files) => {
                            const file = files[0]
                            if (!file) {
                              field.onChange(undefined)
                              return
                            }

                            if (file.type.startsWith("image/")) {
                              // TODO: Figure out what the sweet spot is, when I tried to change it further,
                              // it didn't work on my taxi receipt..
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

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? t("expense.processing")
                : t("expense.generateReport")}
            </Button>
            <Button
              type="button"
              variant="outline"
              asChild
              className="flex items-center gap-2"
            >
              <a
                target="_blank"
                href={`mailto:faktura@java.no?subject=Utlegg ${form.getValues("date").toLocaleDateString("sv")} - ${form.getValues("name")}&body=${encodeURIComponent(`Hei, jeg har gjort utlegg for ${form
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

export const getStaticProps: GetStaticProps = async ({
  locale,
}: {
  locale?: string
}) => {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "no",
        ["common"],
        nextI18nConfig,
        ["no", "en"],
      )),
    },
  }
}
