import { z } from "zod"

/** ISO2 codes of countries that use IBAN (SEPA / international IBAN zone) */
export const IBAN_COUNTRY_ISO2 = new Set([
  "AD",
  "AT",
  "BE",
  "BA",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FO",
  "FI",
  "FR",
  "DE",
  "GI",
  "GR",
  "GL",
  "HU",
  "IS",
  "IE",
  "IT",
  "LV",
  "LI",
  "LT",
  "LU",
  "MK",
  "MT",
  "MC",
  "ME",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SM",
  "RS",
  "SK",
  "SI",
  "ES",
  "SE",
  "CH",
  "GB",
  "VA",
  "AL",
  "AZ",
  "BH",
  "BR",
  "CR",
  "DO",
  "EG",
  "GE",
  "GT",
  "IL",
  "JO",
  "KZ",
  "KW",
  "LB",
  "MR",
  "MU",
  "MD",
  "PK",
  "PS",
  "QA",
  "LC",
  "SA",
  "SC",
  "TL",
  "TN",
  "TR",
  "UA",
  "AE",
  "VG",
  "IQ",
  "BY",
  "SV",
  "LY",
  "SD",
  "BI",
  "DJ",
  "RU",
  "SO",
  "NI",
  "MN",
  "FK",
  "OM",
  "HN",
  "AO",
  "BF",
  "BJ",
  "CF",
  "CG",
  "CI",
  "CM",
  "CV",
  "DZ",
  "GA",
  "GQ",
  "GW",
  "IR",
  "MA",
  "MG",
  "ML",
  "MZ",
  "NE",
  "SN",
  "TD",
  "TG",
  "KM",
])

/**
 * Classify bank country for form flow: SEPA (IBAN), US (ABA + SWIFT etc.), or Other.
 */
export function getBankCountryType(iso2: string): "sepa" | "us" | "other" {
  if (iso2 === "US") return "us"
  if (IBAN_COUNTRY_ISO2.has(iso2)) return "sepa"
  return "other"
}

/** IBAN total length per country (ISO 13616). Used for validation and building IBAN from BBAN. */
export const IBAN_COUNTRY_LENGTHS: Record<string, number> = {
  AD: 24, AT: 20, BE: 16, BA: 20, BG: 22, HR: 21, CY: 28, CZ: 24, DK: 18,
  EE: 20, FO: 18, FI: 18, FR: 27, DE: 22, GI: 23, GR: 27, GL: 18, HU: 28,
  IS: 26, IE: 22, IT: 27, LV: 21, LI: 21, LT: 20, LU: 20, MK: 19, MT: 31,
  MC: 27, ME: 22, NL: 18, NO: 15, PL: 28, PT: 25, RO: 24, SM: 27, RS: 22,
  SK: 24, SI: 19, ES: 24, SE: 24, CH: 21, GB: 22, VA: 22, AL: 28, AZ: 28,
  BH: 22, BR: 29, CR: 22, DO: 28, EG: 29, GE: 22, GT: 28, IL: 23, JO: 30,
  KZ: 20, KW: 30, LB: 28, MR: 27, MU: 30, MD: 24, PK: 24, PS: 29, QA: 29,
  LC: 32, SA: 24, SC: 31, TL: 23, TN: 24, TR: 26, UA: 29, AE: 23, VG: 24,
  IQ: 23, BY: 28, SV: 28, LY: 25, SD: 18, BI: 27, DJ: 27, RU: 33, SO: 23,
  NI: 28, MN: 20, FK: 18, OM: 23, HN: 28, AO: 25, BF: 28, BJ: 28, CF: 27,
  CG: 27, CI: 28, CM: 27, CV: 25, DZ: 26, GA: 27, GQ: 27, GW: 25, IR: 26,
  MA: 28, MG: 27, ML: 28, MZ: 25, NE: 28, SN: 28, TD: 27, TG: 28, KM: 27,
}

/** SEPA countries where the BBAN is digits-only (no letters). Use for country+digits IBAN input. */
export const IBAN_NUMERIC_BBAN_ISO2 = new Set([
  "NO", "SE", "DK", "FI", "DE", "ES", "AT", "BE", "PL", "PT", "RO", "SK", "SI",
  "EE", "LV", "LT", "LU", "HR", "CY", "CZ", "BG", "RS", "ME", "MK", "SM", "VA",
])

/** Length of the BBAN part (IBAN without country code and check digits) for a country. */
export function getIBANBbanLength(iso2: string): number | null {
  const total = IBAN_COUNTRY_LENGTHS[iso2.toUpperCase()]
  return total != null ? total - 4 : null
}

/**
 * Build full IBAN from country code and BBAN (digits only).
 * Computes check digits per ISO 13616 (mod 97).
 */
export function buildIBAN(countryCode: string, bban: string): string {
  const cc = countryCode.toUpperCase().replace(/\s/g, "")
  const cleanBban = bban.replace(/\s/g, "").replace(/\D/g, "")
  if (cc.length !== 2 || !/^[A-Z]{2}$/.test(cc) || !cleanBban) return ""
  const rearranged = cleanBban + cc + "00"
  const expanded = rearranged
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0)
      return code >= 65 && code <= 90 ? (code - 55).toString() : char
    })
    .join("")
  let remainder = 0
  for (let i = 0; i < expanded.length; i += 7) {
    const chunk = remainder + expanded.substring(i, i + 7)
    remainder = parseInt(chunk, 10) % 97
  }
  const check = String(98 - remainder).padStart(2, "0")
  return (cc + check + cleanBban).toUpperCase()
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
        if (!(data.bankSwiftBic || "").trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.bankSwiftRequired"),
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
        if (!(data.bankRoutingNumber || "").trim())
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("expense.errors.bankRoutingRequired"),
            path: ["bankRoutingNumber"],
          })
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
 *
 * @param accountNumber The account number to validate
 * @returns boolean indicating if the account number is valid
 */
export const validateBankAccount = (accountNumber: string): boolean => {
  // Remove all non-alphanumeric characters
  const cleanAccountNumber = accountNumber
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()

  // If it starts with 2 letters, it's likely an IBAN
  if (/^[A-Z]{2}/.test(cleanAccountNumber)) {
    return validateIBAN(cleanAccountNumber)
  }

  // Otherwise, treat it as a Norwegian account number (BBAN)
  return validateNorwegianBBAN(cleanAccountNumber)
}

/**
 * Validates a Norwegian bank account number (BBAN)
 *
 * @param accountNumber The account number to validate (cleaned, digits only)
 * @returns boolean indicating if the account number is valid
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

/**
 * Validates an International Bank Account Number (IBAN)
 *
 * @param iban The IBAN to validate (cleaned, uppercase, no spaces)
 * @returns boolean indicating if the IBAN is valid
 */
export const validateIBAN = (iban: string): boolean => {
  // Basic format check: country code (2 letters) + check digits (2 digits) + BBAN (up to 30 chars)
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(iban)) {
    return false
  }

  const countryCode = iban.substring(0, 2)
  const expectedLength = IBAN_COUNTRY_LENGTHS[countryCode]

  // If we know the expected length for this country and it doesn't match, reject it
  if (expectedLength && iban.length !== expectedLength) {
    return false
  }

  // Structure validation for specific countries
  // This validates the format of the BBAN part (after the country code and check digits)
  const bban = iban.substring(4)

  // Define structure patterns for common countries
  const countryPatterns: Record<string, RegExp> = {
    NO: /^\d{11}$/, // Norway: 11 digits
    SE: /^\d{20}$/, // Sweden: 20 digits
    DK: /^\d{14}$/, // Denmark: 14 digits
    FI: /^\d{14}$/, // Finland: 14 digits
    NL: /^[A-Z]{4}\d{10}$/, // Netherlands: 4 letters + 10 digits
    GB: /^[A-Z]{4}\d{14}$/, // UK: 4 letters + 14 digits
    DE: /^\d{18}$/, // Germany: 18 digits
    FR: /^\d{10}[A-Z0-9]{11}\d{2}$/, // France: 10 digits + 11 alphanumeric + 2 digits
    ES: /^\d{20}$/, // Spain: 20 digits
    IT: /^[A-Z]\d{10}[A-Z0-9]{12}$/, // Italy: 1 letter + 10 digits + 12 alphanumeric
  }

  // Check structure if we have a pattern for this country
  if (
    countryPatterns[countryCode] &&
    !countryPatterns[countryCode].test(bban)
  ) {
    return false
  }

  // Move the first 4 characters to the end
  const rearranged = iban.substring(4) + iban.substring(0, 4)

  // Replace each letter with two digits (A=10, B=11, ..., Z=35)
  const expanded = rearranged
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0)
      // If it's a letter, convert to number (A=10, B=11, etc.)
      return code >= 65 && code <= 90 ? (code - 55).toString() : char
    })
    .join("")

  // Perform mod-97 operation
  // Since JavaScript can't handle numbers this large, we need to do it in chunks
  let remainder = 0
  for (let i = 0; i < expanded.length; i += 7) {
    const chunk = remainder + expanded.substring(i, i + 7)
    remainder = parseInt(chunk, 10) % 97
  }

  // If the remainder is 1, the IBAN is valid
  return remainder === 1
}

// For backward compatibility
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
