import { countrySpecs, isValidIBAN, isValidBIC, electronicFormatIBAN } from "ibantools"

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

/** IBAN display format: groups of 4 characters, uppercase (same as IbanAccountInput). */
export function formatIBANForDisplay(iban: string): string {
  return (iban || "")
    .replace(/\s+/g, "")
    .replace(/([a-z0-9]{4})/gi, "$1 ")
    .trim()
    .toUpperCase()
}

/** Norwegian BBAN display format: XXXX XX XXXXX (4 + 2 + 5 digits, same as NorwegianAccountInput). */
export function formatNorwegianBBANForDisplay(bban: string): string {
  const digits = (bban || "").replace(/\D/g, "")
  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0, 4)} ${digits.slice(4)}`
  return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`
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
