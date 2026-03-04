import { countries } from "country-data-list"

/** Minimal country shape we need from country-data-list (alpha2, alpha3, name, languages). */
export type CountryRecord = {
  alpha2?: string
  alpha3?: string
  name?: string
  languages?: string[]
}

/**
 * Resolves a country string (alpha-2, alpha-3, or name) to the matching country record.
 * Used for query params, form values, and locale derivation.
 */
export function findCountryByCodeOrName(
  value: string,
): CountryRecord | undefined {
  if (!value || typeof value !== "string") return undefined
  const lower = value.trim().toLowerCase()
  const byAlpha2 = countries.all.find(
    (c: CountryRecord) => c.alpha2?.toLowerCase() === lower,
  ) as CountryRecord | undefined
  const byAlpha3 = byAlpha2
    ? undefined
    : (countries.all.find(
        (c: CountryRecord) => c.alpha3?.toLowerCase() === lower,
      ) as CountryRecord | undefined)
  const byName =
    byAlpha2 || byAlpha3
      ? undefined
      : (countries.all.find(
          (c: CountryRecord) => c.name?.toLowerCase() === lower,
        ) as CountryRecord | undefined)
  return byAlpha2 ?? byAlpha3 ?? byName
}

/**
 * Returns a BCP 47 locale string (e.g. "no-NO") for the given country code or name,
 * or undefined if the country cannot be resolved or has no language data.
 */
export function getDisplayLocaleFromCountry(
  countryCodeOrName: string,
): string | undefined {
  const country = findCountryByCodeOrName(countryCodeOrName)
  if (
    !country?.alpha2 ||
    !country.languages ||
    country.languages.length === 0
  ) {
    return undefined
  }
  return `${country.languages[0]}-${country.alpha2}`
}
