import { z } from "zod"

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

  const formSchema = z.object({
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
      .default(language === "en" ? "United Kingdom" : "Norway"),
    bankAccount: z
      .string({
        required_error: t("expense.errors.invalidAccount"),
        invalid_type_error: t("expense.errors.invalidAccount"),
      })
      .min(1, t("expense.errors.invalidAccount"))
      .refine(
        (str) => validateBankAccount(str),
        t("expense.errors.invalidAccount"),
      ),
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

  // Country-specific length validation
  const countryLengths: Record<string, number> = {
    // European countries
    AD: 24, // Andorra
    AT: 20, // Austria
    BE: 16, // Belgium
    BA: 20, // Bosnia and Herzegovina
    BG: 22, // Bulgaria
    HR: 21, // Croatia
    CY: 28, // Cyprus
    CZ: 24, // Czech Republic
    DK: 18, // Denmark
    EE: 20, // Estonia
    FO: 18, // Faroe Islands
    FI: 18, // Finland
    FR: 27, // France
    DE: 22, // Germany
    GI: 23, // Gibraltar
    GR: 27, // Greece
    GL: 18, // Greenland
    HU: 28, // Hungary
    IS: 26, // Iceland
    IE: 22, // Ireland
    IT: 27, // Italy
    LV: 21, // Latvia
    LI: 21, // Liechtenstein
    LT: 20, // Lithuania
    LU: 20, // Luxembourg
    MK: 19, // North Macedonia
    MT: 31, // Malta
    MC: 27, // Monaco
    ME: 22, // Montenegro
    NL: 18, // Netherlands
    NO: 15, // Norway
    PL: 28, // Poland
    PT: 25, // Portugal
    RO: 24, // Romania
    SM: 27, // San Marino
    RS: 22, // Serbia
    SK: 24, // Slovakia
    SI: 19, // Slovenia
    ES: 24, // Spain
    SE: 24, // Sweden
    CH: 21, // Switzerland
    GB: 22, // United Kingdom

    // Non-European countries
    AL: 28, // Albania
    AZ: 28, // Azerbaijan
    BH: 22, // Bahrain
    BR: 29, // Brazil
    CR: 22, // Costa Rica
    DO: 28, // Dominican Republic
    EG: 29, // Egypt
    GE: 22, // Georgia
    GT: 28, // Guatemala
    IL: 23, // Israel
    JO: 30, // Jordan
    KZ: 20, // Kazakhstan
    KW: 30, // Kuwait
    LB: 28, // Lebanon
    MR: 27, // Mauritania
    MU: 30, // Mauritius
    MD: 24, // Moldova
    PK: 24, // Pakistan
    PS: 29, // Palestine
    QA: 29, // Qatar
    LC: 32, // Saint Lucia
    SA: 24, // Saudi Arabia
    SC: 31, // Seychelles
    TL: 23, // Timor-Leste
    TN: 24, // Tunisia
    TR: 26, // Turkey
    UA: 29, // Ukraine
    AE: 23, // United Arab Emirates
    VA: 22, // Vatican City
    VG: 24, // British Virgin Islands
    IQ: 23, // Iraq
    BY: 28, // Belarus
    SV: 28, // El Salvador
    LY: 25, // Libya
    SD: 18, // Sudan
    BI: 27, // Burundi
    DJ: 27, // Djibouti
    RU: 33, // Russia
    SO: 23, // Somalia
    NI: 28, // Nicaragua
    MN: 20, // Mongolia
    FK: 18, // Falkland Islands
    OM: 23, // Oman
    HN: 28, // Honduras

    // Experimental/Partial IBAN countries
    AO: 25, // Angola
    BF: 28, // Burkina Faso
    BJ: 28, // Benin
    CF: 27, // Central African Republic
    CG: 27, // Congo
    CI: 28, // Ivory Coast
    CM: 27, // Cameroon
    CV: 25, // Cape Verde
    DZ: 26, // Algeria
    GA: 27, // Gabon
    GQ: 27, // Equatorial Guinea
    GW: 25, // Guinea-Bissau
    IR: 26, // Iran
    MA: 28, // Morocco
    MG: 27, // Madagascar
    ML: 28, // Mali
    MZ: 25, // Mozambique
    NE: 28, // Niger
    SN: 28, // Senegal
    TD: 27, // Chad
    TG: 28, // Togo
    KM: 27, // Comoros
  }

  const expectedLength = countryLengths[countryCode]

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
        console.log("Could not parse UNIT_MULT from API response, assuming 1", e)
      }

      const observations = responseData.data.dataSets[0].series["0:0:0:0"].observations

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
