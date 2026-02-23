/**
 * Currency definitions supported by Norges Bank API
 *
 * Norges Bank provides exchange rates for approximately 40 currencies.
 * This list includes the currencies that are available through
 * their API endpoint: https://www.norges-bank.no/tema/Statistikk/Valutakurser/
 *
 * To add a new currency, simply add a new entry to the currencies array
 * with the ISO 4217 currency code and full name.
 */

export type Currency = {
  /** ISO 4217 currency code (e.g., 'USD', 'EUR') */
  code: string
  /** Full currency name (e.g., 'US Dollar', 'Euro') */
  name: string
}

/**
 * List of currencies supported by Norges Bank API
 *
 * Currencies are ordered with NOK first (base currency), followed by
 * commonly used currencies, then alphabetically by code.
 */
export const currencies: Currency[] = [
  // Base currency
  { code: "NOK", name: "Norwegian Krone" },

  // Common currencies
  { code: "EUR", name: "Euro" },
  { code: "USD", name: "US Dollar" },
  { code: "GBP", name: "British Pound" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "DKK", name: "Danish Krone" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CAD", name: "Canadian Dollar" },

  // Other supported currencies (alphabetically)
  { code: "AUD", name: "Australian Dollar" },
  { code: "BDT", name: "Bangladeshi Taka" },
  { code: "BGN", name: "Bulgarian Lev" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "BYN", name: "Belarusian Ruble" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "ILS", name: "Israeli New Shekel" },
  { code: "INR", name: "Indian Rupee" },
  { code: "ISK", name: "Icelandic Krona" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "KRW", name: "South Korean Won" },
  { code: "MMK", name: "Myanmar Kyat" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "RON", name: "Romanian Leu" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "THB", name: "Thai Baht" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "TWD", name: "New Taiwan Dollar" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "ZAR", name: "South African Rand" },
]
