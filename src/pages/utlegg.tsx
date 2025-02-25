import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import nextI18nConfig from "../../next-i18next.config.mjs"
import { Label } from "@/components/ui/label"
import { generatePDF } from "@/lib/pdf"
import { CalendarIcon, Trash2 } from "lucide-react"
import { CategorySelector } from "@/components/CategorySelector"
import { formSchema } from "@/lib/expense"
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
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"
import type { GetServerSideProps } from "next"
import {
  CategoryItem,
  CategoryGroup,
  EXPENSE_CATEGORIES,
} from "@/data/utleggsposter"

type FormValues = z.infer<typeof formSchema>

// BBAN: 8601 11 17947
// IBAN: NO9386011117947

export const getServerSideProps: GetServerSideProps = async ({
  locale = "no",
}) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"], nextI18nConfig, [
        "no",
        "en",
      ])),
    },
  }
}

export default function ExpensePage() {
  const { i18n } = useTranslation()

  const [isLoading, setIsLoading] = useState(false)

  const [queryParamForm, setQueryParamForm] = useQueryStates({
    name: parseAsString.withDefault(""),
    email: parseAsString.withDefault(""),
    streetAddress: parseAsString.withDefault(""),
    postalCode: parseAsString.withDefault(""),
    city: parseAsString.withDefault(""),
    country: parseAsString.withDefault("Norway"),
    bankAccount: parseAsString.withDefault(""),
    categoryGroup: parseAsStringLiteral([
      "alle",
      ...EXPENSE_CATEGORIES.map((c) => c.category),
    ]).withDefault("alle"),
    categoryItem: parseAsStringLiteral([
      "",
      ...EXPENSE_CATEGORIES.map((c) => c.fullName),
    ]).withDefault(""),
  })

  // Local state management
  const [globalCategoryGroup, setGlobalCategoryGroup] = useState(
    queryParamForm.categoryGroup,
  )
  const [globalCategoryItem, setGlobalCategoryItem] = useState(
    queryParamForm.categoryItem,
  )
  const [overriddenCategories, setOverriddenCategories] = useState<
    Record<number, CategoryGroup>
  >({})
  const [overriddenCategoryItems, setOverriddenCategoryItems] = useState<
    Record<number, CategoryItem>
  >({})

  // Initialize react-hook-form with zod resolver
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
          category: queryParamForm.categoryItem,
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

  useEffect(() => {
    const expenses = form.getValues("expenses")
    expenses.forEach((_, index) => {
      if (!overriddenCategoryItems[index]) {
        form.setValue(`expenses.${index}.category`, globalCategoryItem)
      }
    })
  }, [form, globalCategoryItem, overriddenCategoryItems])

  // Add useEffect to sync specific form values with URL params
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Only update for specific fields we want to sync
      const syncableFields = [
        "name",
        "email",
        "streetAddress",
        "postalCode",
        "city",
        "country",
        "bankAccount",
      ]

      if (!name || !syncableFields.includes(name)) return

      // Update only the changed field in URL params
      setQueryParamForm((prev) => ({
        ...prev,
        [name]: value[name as keyof typeof value] || "",
      }))
    })

    return () => subscription.unsubscribe()
  }, [form, setQueryParamForm])

  // Add separate effect for category changes
  useEffect(() => {
    setQueryParamForm((prev) => ({
      ...prev,
      categoryGroup: globalCategoryGroup,
      categoryItem: globalCategoryItem,
    }))
  }, [globalCategoryGroup, globalCategoryItem, setQueryParamForm])

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
          category: "",
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

  // Helper to get category for a specific expense index
  const getCategoryForExpense = (index: number): CategoryGroup => {
    return overriddenCategories[index] || globalCategoryGroup
  }

  // Helper to get category item for a specific expense index
  const getCategoryItemForExpense = (index: number) => {
    return overriddenCategoryItems[index] || globalCategoryItem
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <Label>Navn</Label>
                <FormControl>
                  <Input placeholder="Ola Nordmann" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="streetAddress"
            render={({ field }) => (
              <FormItem>
                <Label>Adresse</Label>
                <FormControl>
                  <Input placeholder="Gateveien 1" {...field} />
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
                  <Label>Postnummer</Label>
                  <FormControl>
                    <Input
                      placeholder="1234"
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
                  <Label>Poststed</Label>
                  <FormControl>
                    <Input placeholder="Sted" {...field} />
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
                <Label>Land</Label>
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
                <Label>Kontonummer (IBAN eller BBAN)</Label>
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
                <Label>E-post</Label>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="ola.nordmann@example.com"
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
                  <FormLabel>Dato</FormLabel>
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
                            <span>Velg en dato</span>
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
                    Datoen brukes til å datere utgiftene.
                  </FormDescription>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearForm}
                    >
                      <Eraser className="mr-2 h-4 w-4" />
                      Tøm skjema
                    </Button>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormControl>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Expenses</h2>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    description: "",
                    category: globalCategoryItem,
                    amount: 0,
                    attachment: new File([], ""),
                  })
                }
              >
                Add Expense
              </Button>
            </div>
            <div className="mb-6">
              <Label>Default Category for All Expenses</Label>
              <CategorySelector
                selectedCategory={globalCategoryGroup}
                onCategoryChange={setGlobalCategoryGroup}
                selectedItem={globalCategoryItem}
                onItemChange={(category, value) => {
                  setGlobalCategoryItem(value)
                }}
              />
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
                      <Label>Description</Label>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`expenses.${index}.category`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Category</FormLabel>
                      <div className="space-y-2">
                        <CategorySelector
                          selectedCategory={getCategoryForExpense(index)}
                          onCategoryChange={(category) => {
                            if (category === globalCategoryGroup) {
                              setOverriddenCategories((prev) => {
                                const next = { ...prev }
                                delete next[index]
                                return next
                              })
                            } else {
                              setOverriddenCategories((prev) => ({
                                ...prev,
                                [index]: category,
                              }))
                            }
                          }}
                          selectedItem={getCategoryItemForExpense(index)}
                          onItemChange={(category, value) => {
                            field.onChange(value)
                            if (value === globalCategoryItem) {
                              setOverriddenCategoryItems((prev) => {
                                const next = { ...prev }
                                delete next[index]
                                return next
                              })
                            } else {
                              setOverriddenCategories((prev) => ({
                                ...prev,
                                [index]: category,
                              }))
                              setOverriddenCategoryItems((prev) => ({
                                ...prev,
                                [index]: value,
                              }))
                            }
                          }}
                          showOverrideBadge={
                            overriddenCategories[index] !== undefined ||
                            overriddenCategoryItems[index] !== undefined
                          }
                          globalCategoryItem={globalCategoryItem}
                        />
                        {(overriddenCategories[index] !== undefined ||
                          overriddenCategoryItems[index] !== undefined) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setOverriddenCategories((prev) => {
                                const next = { ...prev }
                                delete next[index]
                                return next
                              })
                              setOverriddenCategoryItems((prev) => {
                                const next = { ...prev }
                                delete next[index]
                                return next
                              })
                              field.onChange(globalCategoryItem)
                            }}
                          >
                            Reset to Global Category
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`expenses.${index}.amount`}
                  render={({ field }) => (
                    <FormItem>
                      <Label>Amount (NOK)</Label>
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
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`expenses.${index}.attachment`}
                  render={({ field }) => (
                    <FormItem>
                      <Label>Attachment</Label>
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

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Processing..." : "Generate Report"}
          </Button>
        </form>
      </Form>
      <Toaster />
    </div>
  )
}
