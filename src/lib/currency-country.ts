/**
 * Maps bank countries to payout currencies we can convert via Norges Bank.
 *
 * Used to:
 * 1. Auto-select the payout currency when a bank country is selected
 * 2. Convert expense amounts into that currency on the report
 */

import { countries } from "country-data-list"
import { currencies } from "@/data/currencies"

/**
 * List and set of currency codes we support.
 * The list order is used when choosing a default currency for a country.
 */
const supportedCurrencyCodes = currencies.map((c) => c.code)
const supportedCurrencyCodeSet = new Set(supportedCurrencyCodes)
const supportedCurrencyPriority = new Map(
  supportedCurrencyCodes.map((code, index) => [code, index]),
)

/**
 * Map of country ISO2 → supported currency codes (a country may use multiple currencies)
 */
const countryToSupportedCurrencies = new Map<string, string[]>()

// Build the mapping in one pass through countries.
for (const country of countries.all) {
  if (!country.alpha2 || !country.currencies?.length) continue

  const supportedCurrenciesForCountry = country.currencies
    .filter((currency) => supportedCurrencyCodeSet.has(currency))
    .sort(
      (a, b) =>
        (supportedCurrencyPriority.get(a) ?? Number.MAX_SAFE_INTEGER) -
        (supportedCurrencyPriority.get(b) ?? Number.MAX_SAFE_INTEGER),
    )

  if (supportedCurrenciesForCountry.length === 0) continue

  countryToSupportedCurrencies.set(
    country.alpha2.toUpperCase(),
    supportedCurrenciesForCountry,
  )
}

/**
 * Get all supported currencies for a given country ISO2 code.
 */
export function getTargetCurrencies(countryIso2: string): string[] {
  if (!countryIso2) return []
  return countryToSupportedCurrencies.get(countryIso2.toUpperCase()) ?? []
}

/**
 * Get the default currency for a given country ISO2 code.
 * If multiple currencies are supported for that country, this returns the first one
 * in our supported-currency priority list.
 */
export function getTargetCurrency(countryIso2: string): string | undefined {
  return getTargetCurrencies(countryIso2)[0]
}

/**
 * Currency the report should pay out in.
 * Norwegian accounts are always NOK. Otherwise the bank country's currency,
 * falling back to NOK when Norges Bank has no rate for that country.
 */
export function resolvePayoutCurrency(
  residesInNorway: boolean,
  bankCountryIso2: string = "",
): string {
  if (residesInNorway) return "NOK"
  return getTargetCurrency(bankCountryIso2) || "NOK"
}
