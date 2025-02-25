import { EXPENSE_CATEGORIES } from "@/data/utleggsposter"
import { z } from "zod"

// Create schemas with localized error messages
export const createExpenseSchemas = (t: (key: string) => string, language: string = "no") => {
  const expenseItemSchema = z.object({
    description: z.string().min(2, t("expense.errors.descriptionRequired")),
    category: z
      .string()
      .refine((val) => EXPENSE_CATEGORIES.some((cat) => cat.fullName === val), {
        message: t("expense.errors.categoryRequired"),
      }),
    amount: z.number().min(0.01, t("expense.errors.amountPositive")),
    attachment: z
      .custom<File>((file) => file instanceof File, t("expense.errors.fileRequired"))
      .refine((file) => file.size > 0, t("expense.errors.fileRequired"))
      .default(new File([], "")),
  })

  const formSchema = z.object({
    name: z.string().min(1, t("expense.errors.nameRequired")),
    streetAddress: z.string().min(1, t("expense.errors.streetRequired")),
    postalCode: z.string().min(1, t("expense.errors.postalRequired")),
    city: z.string().min(1, t("expense.errors.cityRequired")),
    country: z.string().min(1, t("expense.errors.countryRequired"))
      .default(language === "en" ? "United Kingdom" : "Norway"),
    bankAccount: z
      .string()
      .refine((str) => validateAccountNumber(str), t("expense.errors.invalidAccount")),
    email: z.string().email(t("expense.errors.invalidEmail")),
    date: z.date().min(new Date("2020-01-01"), t("expense.errors.dateRequired")),
    expenses: z
      .array(expenseItemSchema)
      .min(1, t("expense.errors.expenseRequired")),
  })

  return { expenseItemSchema, formSchema }
}

export const validateAccountNumber = (accountNumber: string) => {
  const cleanAccountNumber = accountNumber.replace(/\D/g, "")
  if (cleanAccountNumber.length !== 11) return false
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const sum = cleanAccountNumber
    .slice(0, 10)
    .split("")
    .map((c) => parseInt(c))
    .reduce((acc, digit, index) => acc + digit * (weights?.[index] ?? 0), 0)
  const checkDigit = (11 - (sum % 11)) % 11
  return checkDigit === parseInt(cleanAccountNumber.charAt(10))
}
