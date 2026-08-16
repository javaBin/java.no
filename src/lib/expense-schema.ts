import { z } from "zod"

import {
  getBankCountryType,
  validateABARoutingNumber,
  validateBIC,
  validateIBAN,
  validateNorwegianBBAN,
} from "@/lib/banking"

// Create schemas with localized error messages
export const createExpenseSchemas = (t: (key: string) => string) => {
  const expenseItemSchema = z.object({
    description: z
      .string({
        required_error: t("expense.errors.descriptionRequired"),
        invalid_type_error: t("expense.errors.descriptionRequired"),
      })
      .min(2, t("expense.errors.descriptionRequired")),
    amount: z
      .number({
        required_error: t("expense.errors.amountPositive"),
        invalid_type_error: t("expense.errors.amountPositive"),
      })
      .min(0.01, t("expense.errors.amountPositive")),
    currency: z
      .string({
        required_error: t("expense.errors.currencyRequired"),
        invalid_type_error: t("expense.errors.currencyRequired"),
      })
      .min(1, t("expense.errors.currencyRequired"))
      .default("NOK"),
    date: z
      .date({
        required_error: t("expense.errors.dateRequired"),
        invalid_type_error: t("expense.errors.dateRequired"),
      })
      .min(new Date("2020-01-01"), t("expense.errors.dateRequired")),
    attachment: z
      .custom<File>(
        (file) => file instanceof File,
        t("expense.errors.fileRequired"),
      )
      .refine((file) => file.size > 0, t("expense.errors.fileRequired"))
      .default(new File([], "")),
  })

  const formSchema = z
    .object({
      name: z
        .string({
          required_error: t("expense.errors.nameRequired"),
          invalid_type_error: t("expense.errors.nameRequired"),
        })
        .min(1, t("expense.errors.nameRequired")),
      streetAddress: z
        .string({
          required_error: t("expense.errors.streetRequired"),
          invalid_type_error: t("expense.errors.streetRequired"),
        })
        .min(1, t("expense.errors.streetRequired")),
      postalCode: z
        .string({
          required_error: t("expense.errors.postalRequired"),
          invalid_type_error: t("expense.errors.postalRequired"),
        })
        .min(1, t("expense.errors.postalRequired")),
      city: z
        .string({
          required_error: t("expense.errors.cityRequired"),
          invalid_type_error: t("expense.errors.cityRequired"),
        })
        .min(1, t("expense.errors.cityRequired")),
      country: z
        .string({
          required_error: t("expense.errors.countryRequired"),
          invalid_type_error: t("expense.errors.countryRequired"),
        })
        // Allow empty by default; we enforce "required" only when not residing
        // in Norway in the superRefine block below.
        .optional()
        .default(""),
      residesInNorway: z.boolean().default(true),
      bankCountry: z.string().optional().default(""),
      bankCountryIso2: z.string().optional().default(""),
      bankIban: z.string().optional().default(""),
      bankRoutingNumber: z.string().optional().default(""),
      bankAccountNumber: z.string().optional().default(""),
      bankAccountType: z
        .enum(["checking", "savings"])
        .optional()
        .default("checking"),
      bankSwiftBic: z.string().optional().default(""),
      bankName: z.string().optional().default(""),
      bankAddress: z.string().optional().default(""),
      bankAccountHolderName: z.string().optional().default(""),
      skipBankValidation: z.boolean().optional().default(false),
      /** Target currency based on bank country (auto-populated when bank country changes) */
      targetCurrency: z.string().optional().default("NOK"),
      email: z
        .string({
          required_error: t("expense.errors.invalidEmail"),
          invalid_type_error: t("expense.errors.invalidEmail"),
        })
        .email(t("expense.errors.invalidEmail")),
      reimbursementTarget: z.enum(["javaBin", "javaZone"], {
        required_error: t("expense.errors.reimbursementTargetRequired"),
        invalid_type_error: t("expense.errors.reimbursementTargetRequired"),
      }),
      expenses: z
        .array(expenseItemSchema, {
          required_error: t("expense.errors.expenseRequired"),
          invalid_type_error: t("expense.errors.expenseRequired"),
        })
        .min(1, t("expense.errors.expenseRequired")),
    })
    .superRefine((data, ctx) => {
      const skip = data.skipBankValidation === true

      // Country is required only when the user does NOT reside in Norway.
      if (!data.residesInNorway) {
        const country = (data.country || "").trim()
        if (!country) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.countryRequired"),
            path: ["country"],
          })
        }
      }

      if (data.residesInNorway) {
        const accountNumber = (data.bankAccountNumber || "").replace(/\s/g, "")
        if (!accountNumber) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.bankAccountNumberRequired"),
            path: ["bankAccountNumber"],
          })
          return
        }
        if (!skip && !validateNorwegianBBAN(accountNumber)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.invalidNorwegianAccount"),
            path: ["bankAccountNumber"],
          })
        }
        return
      }

      if (!data.bankCountryIso2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("expense.errors.bankCountryRequired"),
          path: ["bankCountry"],
        })
        return
      }

      const type = getBankCountryType(data.bankCountryIso2)
      if (type === "sepa") {
        const iban = (data.bankIban || "").replace(/\s/g, "")
        if (!iban) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.bankIbanRequired"),
            path: ["bankIban"],
          })
        }
        const swiftBic = (data.bankSwiftBic || "").trim()
        if (!swiftBic) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.bankSwiftRequired"),
            path: ["bankSwiftBic"],
          })
        } else if (!skip && !validateBIC(swiftBic)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.invalidSwift"),
            path: ["bankSwiftBic"],
          })
        }
        if (!skip && iban && !validateIBAN(iban.toUpperCase())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.invalidAccount"),
            path: ["bankIban"],
          })
        }
        return
      }
      if (type === "us") {
        // Skip all US bank validation when the user opted out
        if (skip) return

        const routing = (data.bankRoutingNumber || "").trim()
        if (!routing) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.bankRoutingRequired"),
            path: ["bankRoutingNumber"],
          })
        } else if (!validateABARoutingNumber(routing)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.invalidRoutingNumber"),
            path: ["bankRoutingNumber"],
          })
        }
        const accountNum = (data.bankAccountNumber || "").trim()
        if (!accountNum) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.bankAccountNumberRequired"),
            path: ["bankAccountNumber"],
          })
        } else {
          const digitsOnly = accountNum.replace(/\D/g, "")
          if (digitsOnly.length < 4 || digitsOnly.length > 17) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("expense.errors.invalidUsAccountNumber"),
              path: ["bankAccountNumber"],
            })
          }
        }
        const usSwift = (data.bankSwiftBic || "").trim()
        if (!usSwift) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.bankSwiftRequired"),
            path: ["bankSwiftBic"],
          })
        } else if (!validateBIC(usSwift)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.invalidSwift"),
            path: ["bankSwiftBic"],
          })
        }
        if (!(data.bankName || "").trim())
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.bankNameRequired"),
            path: ["bankName"],
          })
        if (!(data.bankAddress || "").trim())
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.bankAddressRequired"),
            path: ["bankAddress"],
          })
        if (!(data.bankAccountHolderName || "").trim())
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.bankHolderRequired"),
            path: ["bankAccountHolderName"],
          })
        return
      }
      // type === "other"
      if (!(data.bankAccountNumber || "").trim())
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("expense.errors.bankAccountNumberRequired"),
          path: ["bankAccountNumber"],
        })
      if (!(data.bankSwiftBic || "").trim())
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("expense.errors.bankSwiftRequired"),
          path: ["bankSwiftBic"],
        })
      if (!(data.bankName || "").trim())
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("expense.errors.bankNameRequired"),
          path: ["bankName"],
        })
      if (!(data.bankAddress || "").trim())
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("expense.errors.bankAddressRequired"),
          path: ["bankAddress"],
        })
      if (!(data.bankAccountHolderName || "").trim())
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("expense.errors.bankHolderRequired"),
          path: ["bankAccountHolderName"],
        })
    })

  return { expenseItemSchema, formSchema }
}

/**
 * Shape of the expense form. The schema is rebuilt per render to pick up
 * translated messages, but its shape does not depend on them, so this can be
 * derived once at module scope and shared by anything typing the form.
 */
export type ExpenseFormValues = z.infer<
  ReturnType<typeof createExpenseSchemas>["formSchema"]
>
