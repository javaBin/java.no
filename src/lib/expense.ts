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
      .refine((str) => validateBankAccount(str), t("expense.errors.invalidAccount")),
    email: z.string().email(t("expense.errors.invalidEmail")),
    date: z.date().min(new Date("2020-01-01"), t("expense.errors.dateRequired")),
    expenses: z
      .array(expenseItemSchema)
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
  const cleanAccountNumber = accountNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  
  // If it starts with 2 letters, it's likely an IBAN
  if (/^[A-Z]{2}/.test(cleanAccountNumber)) {
    return validateIBAN(cleanAccountNumber);
  }
  
  // Otherwise, treat it as a Norwegian account number (BBAN)
  return validateNorwegianBBAN(cleanAccountNumber);
}

/**
 * Validates a Norwegian bank account number (BBAN)
 * 
 * @param accountNumber The account number to validate (cleaned, digits only)
 * @returns boolean indicating if the account number is valid
 */
export const validateNorwegianBBAN = (accountNumber: string): boolean => {
  if (accountNumber.length !== 11) return false;
  
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = accountNumber
    .slice(0, 10)
    .split("")
    .map((c) => parseInt(c))
    .reduce((acc, digit, index) => acc + digit * weights[index]!, 0);
  
  const checkDigit = (11 - (sum % 11)) % 11;
  return checkDigit === parseInt(accountNumber.charAt(10));
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
    return false;
  }
  
  const countryCode = iban.substring(0, 2);
  
  // Country-specific length validation
  const countryLengths: Record<string, number> = {
    // European countries
    'AD': 24, // Andorra
    'AT': 20, // Austria
    'BE': 16, // Belgium
    'BA': 20, // Bosnia and Herzegovina
    'BG': 22, // Bulgaria
    'HR': 21, // Croatia
    'CY': 28, // Cyprus
    'CZ': 24, // Czech Republic
    'DK': 18, // Denmark
    'EE': 20, // Estonia
    'FO': 18, // Faroe Islands
    'FI': 18, // Finland
    'FR': 27, // France
    'DE': 22, // Germany
    'GI': 23, // Gibraltar
    'GR': 27, // Greece
    'GL': 18, // Greenland
    'HU': 28, // Hungary
    'IS': 26, // Iceland
    'IE': 22, // Ireland
    'IT': 27, // Italy
    'LV': 21, // Latvia
    'LI': 21, // Liechtenstein
    'LT': 20, // Lithuania
    'LU': 20, // Luxembourg
    'MK': 19, // North Macedonia
    'MT': 31, // Malta
    'MC': 27, // Monaco
    'ME': 22, // Montenegro
    'NL': 18, // Netherlands
    'NO': 15, // Norway
    'PL': 28, // Poland
    'PT': 25, // Portugal
    'RO': 24, // Romania
    'SM': 27, // San Marino
    'RS': 22, // Serbia
    'SK': 24, // Slovakia
    'SI': 19, // Slovenia
    'ES': 24, // Spain
    'SE': 24, // Sweden
    'CH': 21, // Switzerland
    'GB': 22, // United Kingdom
    
    // Non-European countries
    'AL': 28, // Albania
    'AZ': 28, // Azerbaijan
    'BH': 22, // Bahrain
    'BR': 29, // Brazil
    'CR': 22, // Costa Rica
    'DO': 28, // Dominican Republic
    'EG': 29, // Egypt
    'GE': 22, // Georgia
    'GT': 28, // Guatemala
    'IL': 23, // Israel
    'JO': 30, // Jordan
    'KZ': 20, // Kazakhstan
    'KW': 30, // Kuwait
    'LB': 28, // Lebanon
    'MR': 27, // Mauritania
    'MU': 30, // Mauritius
    'MD': 24, // Moldova
    'PK': 24, // Pakistan
    'PS': 29, // Palestine
    'QA': 29, // Qatar
    'LC': 32, // Saint Lucia
    'SA': 24, // Saudi Arabia
    'SC': 31, // Seychelles
    'TL': 23, // Timor-Leste
    'TN': 24, // Tunisia
    'TR': 26, // Turkey
    'UA': 29, // Ukraine
    'AE': 23, // United Arab Emirates
    'VA': 22, // Vatican City
    'VG': 24, // British Virgin Islands
    'IQ': 23, // Iraq
    'BY': 28, // Belarus
    'SV': 28, // El Salvador
    'LY': 25, // Libya
    'SD': 18, // Sudan
    'BI': 27, // Burundi
    'DJ': 27, // Djibouti
    'RU': 33, // Russia
    'SO': 23, // Somalia
    'NI': 28, // Nicaragua
    'MN': 20, // Mongolia
    'FK': 18, // Falkland Islands
    'OM': 23, // Oman
    'HN': 28, // Honduras
    
    // Experimental/Partial IBAN countries
    'AO': 25, // Angola
    'BF': 28, // Burkina Faso
    'BJ': 28, // Benin
    'CF': 27, // Central African Republic
    'CG': 27, // Congo
    'CI': 28, // Ivory Coast
    'CM': 27, // Cameroon
    'CV': 25, // Cape Verde
    'DZ': 26, // Algeria
    'GA': 27, // Gabon
    'GQ': 27, // Equatorial Guinea
    'GW': 25, // Guinea-Bissau
    'IR': 26, // Iran
    'MA': 28, // Morocco
    'MG': 27, // Madagascar
    'ML': 28, // Mali
    'MZ': 25, // Mozambique
    'NE': 28, // Niger
    'SN': 28, // Senegal
    'TD': 27, // Chad
    'TG': 28, // Togo
    'KM': 27, // Comoros
  };
  
  const expectedLength = countryLengths[countryCode];
  
  // If we know the expected length for this country and it doesn't match, reject it
  if (expectedLength && iban.length !== expectedLength) {
    return false;
  }
  
  // Structure validation for specific countries
  // This validates the format of the BBAN part (after the country code and check digits)
  const bban = iban.substring(4);
  
  // Define structure patterns for common countries
  const countryPatterns: Record<string, RegExp> = {
    'NO': /^\d{11}$/, // Norway: 11 digits
    'SE': /^\d{20}$/, // Sweden: 20 digits
    'DK': /^\d{14}$/, // Denmark: 14 digits
    'FI': /^\d{14}$/, // Finland: 14 digits
    'NL': /^[A-Z]{4}\d{10}$/, // Netherlands: 4 letters + 10 digits
    'GB': /^[A-Z]{4}\d{14}$/, // UK: 4 letters + 14 digits
    'DE': /^\d{18}$/, // Germany: 18 digits
    'FR': /^\d{10}[A-Z0-9]{11}\d{2}$/, // France: 10 digits + 11 alphanumeric + 2 digits
    'ES': /^\d{20}$/, // Spain: 20 digits
    'IT': /^[A-Z]\d{10}[A-Z0-9]{12}$/, // Italy: 1 letter + 10 digits + 12 alphanumeric
  };
  
  // Check structure if we have a pattern for this country
  if (countryPatterns[countryCode] && !countryPatterns[countryCode].test(bban)) {
    return false;
  }
  
  // Move the first 4 characters to the end
  const rearranged = iban.substring(4) + iban.substring(0, 4);
  
  // Replace each letter with two digits (A=10, B=11, ..., Z=35)
  const expanded = rearranged.split('')
    .map(char => {
      const code = char.charCodeAt(0);
      // If it's a letter, convert to number (A=10, B=11, etc.)
      return (code >= 65 && code <= 90) 
        ? (code - 55).toString() 
        : char;
    })
    .join('');
  
  // Perform mod-97 operation
  // Since JavaScript can't handle numbers this large, we need to do it in chunks
  let remainder = 0;
  for (let i = 0; i < expanded.length; i += 7) {
    const chunk = remainder + expanded.substring(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }
  
  // If the remainder is 1, the IBAN is valid
  return remainder === 1;
}

// For backward compatibility
export const validateAccountNumber = validateBankAccount;
