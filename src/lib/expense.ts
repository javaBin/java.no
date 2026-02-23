import { z } from "zod"
import {
  composeIBAN,
  countrySpecs,
  isValidIBAN,
  isValidBIC,
  electronicFormatIBAN,
} from "ibantools"

/**
 * Classify bank country for form flow: SEPA (IBAN), US (ABA + SWIFT etc.), or Other.
 * Uses ibantools country specs to determine IBAN support.
 */
export function getBankCountryType(iso2: string): "sepa" | "us" | "other" {
  if (iso2 === "US") return "us"
  const spec = countrySpecs[iso2.toUpperCase()]
  if (spec?.IBANRegistry) return "sepa"
  return "other"
}

/** Length of the BBAN part (IBAN without country code and check digits) for a country. */
export function getIBANBbanLength(iso2: string): number | null {
  const spec = countrySpecs[iso2.toUpperCase()]
  return spec?.chars != null ? spec.chars - 4 : null
}

/**
 * Build full IBAN from country code and BBAN.
 * Computes check digits per ISO 13616 via ibantools.
 * For partial BBANs (during typing), uses placeholder check digits
 * so the value remains extractable; real check digits are computed on blur.
 */
export function buildIBAN(countryCode: string, bban: string): string {
  const cc = countryCode.toUpperCase().replace(/\s/g, "")
  const cleanBban = bban.replace(/\s/g, "")
  if (cc.length !== 2 || !/^[A-Z]{2}$/.test(cc) || !cleanBban) return ""
  return composeIBAN({ countryCode: cc, bban: cleanBban }) ?? cc + "00" + cleanBban
}

// Create schemas with localized error messages
export const createExpenseSchemas = (
  t: (key: string) => string,
  language: string = "no",
) => {
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
        .min(1, t("expense.errors.countryRequired"))
        .default("Norway"),
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
      email: z
        .string({
          required_error: t("expense.errors.invalidEmail"),
          invalid_type_error: t("expense.errors.invalidEmail"),
        })
        .email(t("expense.errors.invalidEmail")),
      expenses: z
        .array(expenseItemSchema, {
          required_error: t("expense.errors.expenseRequired"),
          invalid_type_error: t("expense.errors.expenseRequired"),
        })
        .min(1, t("expense.errors.expenseRequired")),
    })
    .superRefine((data, ctx) => {
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
        // Validate Norwegian BBAN (11 digits with modulo-11)
        if (!validateNorwegianBBAN(accountNumber)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.invalidNorwegianAccount"),
            path: ["bankAccountNumber"],
          })
        }
        return
      }

      // International: require country
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
        } else if (!validateBIC(swiftBic)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.invalidSwift"),
            path: ["bankSwiftBic"],
          })
        }
        if (iban && !validateIBAN(iban.toUpperCase())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.invalidAccount"),
            path: ["bankIban"],
          })
        }
        return
      }
      if (type === "us") {
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
 * Validates a bank account number, supporting both Norwegian BBAN and international IBAN formats.
 * Automatically detects the format based on the input.
 */
export const validateBankAccount = (accountNumber: string): boolean => {
  const cleanAccountNumber = accountNumber
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()

  if (/^[A-Z]{2}/.test(cleanAccountNumber)) {
    return validateIBAN(cleanAccountNumber)
  }

  return validateNorwegianBBAN(cleanAccountNumber)
}

/**
 * Validates a Norwegian bank account number (BBAN).
 * Uses modulo-11 check digit validation.
 */
export const validateNorwegianBBAN = (accountNumber: string): boolean => {
  if (accountNumber.length !== 11) return false

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const sum = accountNumber
    .slice(0, 10)
    .split("")
    .map((c) => parseInt(c))
    .reduce((acc, digit, index) => acc + digit * weights[index]!, 0)

  const checkDigit = (11 - (sum % 11)) % 11
  return checkDigit === parseInt(accountNumber.charAt(10))
}

/** Validates an IBAN (format, length, check digits) via ibantools. */
export const validateIBAN = (iban: string): boolean => {
  const electronic = electronicFormatIBAN(iban)
  if (!electronic) return false
  return isValidIBAN(electronic)
}

/** Validates a SWIFT/BIC code (8 or 11 characters) via ibantools. */
export const validateBIC = (bic: string): boolean => {
  return isValidBIC(bic.replace(/\s/g, "").toUpperCase())
}

/**
 * Validates a US ABA routing number (9 digits, checksum with 3-7-1 weights).
 * See https://en.wikipedia.org/wiki/ABA_routing_transit_number#Check_digit
 */
export const validateABARoutingNumber = (routing: string): boolean => {
  const digits = routing.replace(/\D/g, "")
  if (digits.length !== 9) return false

  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1]
  const sum = digits
    .split("")
    .reduce((acc, d, i) => acc + parseInt(d) * weights[i]!, 0)

  return sum % 10 === 0
}

export const validateAccountNumber = validateBankAccount

/**
 * Internal helper to fetch exchange rate data from Norges Bank API
 * @param currency The currency code
 * @param date The date to get the exchange rate for
 * @returns Object with rate and unitMultiplier, or null if not found
 */
async function fetchExchangeRateData(
  currency: string,
  date: Date,
): Promise<{ rate: number; unitMultiplier: number } | null> {
  if (currency === "NOK") {
    return { rate: 1, unitMultiplier: 1 }
  }

  try {
    const dateStr = date.toISOString().split("T")[0]
    // Request a longer period (3 weeks back) to ensure we get business days
    // Since observations are only updated on business days, we need to go back
    // to find the most recent available rate
    const startDate = new Date(date)
    startDate.setDate(startDate.getDate() - 14) // 2 weeks back
    const startDateStr = startDate.toISOString().split("T")[0]

    const url = `https://data.norges-bank.no/api/data/EXR/B.${currency}.NOK.SP?format=sdmx-json&startPeriod=${startDateStr}&endPeriod=${dateStr}&locale=no`
    console.log(url)
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch exchange rate: ${response.statusText}`)
      return null
    }

    const responseData = await response.json()

    try {
      // Extract UNIT_MULT from the API response attributes
      let unitMultiplier = 1
      try {
        const attributes = responseData.data?.structure?.attributes?.series
        if (attributes && Array.isArray(attributes)) {
          const unitMultAttr = attributes.find(
            (attr: { id: string }) => attr.id === "UNIT_MULT",
          )
          if (unitMultAttr?.values?.[0]?.id) {
            const unitMultValue = parseInt(unitMultAttr.values[0].id, 10)
            if (!isNaN(unitMultValue)) {
              unitMultiplier = Math.pow(10, unitMultValue)
            }
          }
        }
      } catch (e) {
        console.log(
          "Could not parse UNIT_MULT from API response, assuming 1",
          e,
        )
      }

      const observations =
        responseData.data.dataSets[0].series["0:0:0:0"].observations

      const observationKeys = Object.keys(observations).sort(
        (a, b) => parseInt(a) - parseInt(b),
      )

      if (observationKeys.length === 0) {
        console.log("No observations found in dataset")
        return null
      }

      const lastKey = observationKeys[observationKeys.length - 1]
      if (!lastKey) {
        console.log("No valid observation key found")
        return null
      }

      const rateStr = observations[lastKey][0]
      const rate = Number(rateStr)

      if (isNaN(rate) || !isFinite(rate)) {
        console.log("Invalid exchange rate value")
        return null
      }

      return { rate, unitMultiplier }
    } catch (e) {
      console.log("Cannot find rate in dataset", e)
    }

    return null
  } catch (error) {
    console.error("Error fetching exchange rate:", error)
    return null
  }
}

/**
 * Fetches exchange rate from Norges Bank API for a given currency and date
 * @param currency The currency code (e.g., 'USD', 'EUR')
 * @param date The date to get the exchange rate for
 * @returns The exchange rate as returned by the API (for display), or null if not found
 */
export async function getExchangeRate(
  currency: string,
  date: Date,
): Promise<number | null> {
  const data = await fetchExchangeRateData(currency, date)
  return data?.rate ?? null
}

/**
 * Converts an amount from one currency to NOK using Norges Bank exchange rates
 * @param amount The amount to convert
 * @param currency The source currency code
 * @param date The date to use for the exchange rate
 * @returns The converted amount in NOK, or the original amount if conversion fails
 */
export async function convertToNOK(
  amount: number,
  currency: string,
  date: Date,
): Promise<number> {
  if (currency === "NOK") {
    return amount
  }

  const data = await fetchExchangeRateData(currency, date)

  if (data === null) {
    console.warn(
      `Could not fetch exchange rate for ${currency} on ${date.toISOString()}, using original amount`,
    )
    return amount
  }

  // Normalize the rate for calculation
  // Example: If API returns 157.80 for DKK with UNIT_MULT=2 (per 100 units),
  // we need to divide by 100 to get the rate per unit: 157.80 / 100 = 1.578
  const normalizedRate = data.rate / data.unitMultiplier

  // Round to 2 decimal places to avoid floating-point precision issues
  // This ensures we always get clean currency values (e.g., 123.45 instead of 123.4500000001)
  const converted = amount * normalizedRate
  return Math.round(converted * 100) / 100
}
