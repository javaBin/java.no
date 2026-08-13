export type ExchangeRateDatum = {
  rate: number
  unitMultiplier: number
  /** The business day the rate is actually quoted for, which may precede the expense date. */
  rateDate: Date
}

export type ExchangeRateDisplayInfo = {
  rate: number
  unitMultiplier: number
  date: Date
  nokAmount: number
}

/** Converts an amount using the raw Norges Bank rate and its UNIT_MULT. */
export function nokAmountFromExchangeRateData(
  amount: number,
  data: { rate: number; unitMultiplier: number },
): number {
  const normalizedRate = data.rate / data.unitMultiplier
  return Math.round(amount * normalizedRate * 100) / 100
}

/**
 * Fetches exchange rate data from Norges Bank API
 * @param currency The currency code
 * @param date The date to get the exchange rate for
 * @returns Object with rate, unitMultiplier and the date the rate is quoted for
 */
export async function fetchExchangeRateData(
  currency: string,
  date: Date,
): Promise<ExchangeRateDatum | null> {
  if (currency === "NOK") {
    return { rate: 1, unitMultiplier: 1, rateDate: date }
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
      } catch {
        // Could not parse UNIT_MULT from API response; fall back to default 1
      }

      // The observation keys are indexes into the TIME_PERIOD dimension, which is
      // where the actual quote dates live.
      let dimensionValues: Array<{ id: string } | string> = []
      const observationDimensions =
        responseData.data?.structure?.dimensions?.observation
      if (Array.isArray(observationDimensions)) {
        const timeDimension = observationDimensions.find(
          (d: { id?: string }) => d.id === "TIME_PERIOD",
        )
        if (Array.isArray(timeDimension?.values)) {
          dimensionValues = timeDimension.values
        }
      }

      const observations =
        responseData.data.dataSets[0].series["0:0:0:0"].observations

      const observationKeys = Object.keys(observations).sort(
        (a, b) => parseInt(a) - parseInt(b),
      )

      if (observationKeys.length === 0) {
        // No observations found in dataset
        return null
      }

      const lastKey = observationKeys[observationKeys.length - 1]
      if (!lastKey) {
        // No valid observation key found
        return null
      }

      const dimValue = dimensionValues[parseInt(lastKey, 10)]
      const rateDateStr =
        typeof dimValue === "string" ? dimValue : dimValue?.id
      const rateDate = rateDateStr
        ? parseISODateString(rateDateStr.substring(0, 10))
        : date

      const rateStr = observations[lastKey][0]
      const rate = Number(rateStr)

      if (isNaN(rate) || !isFinite(rate)) {
        // Invalid exchange rate value
        return null
      }

      return { rate, unitMultiplier, rateDate }
    } catch {
      // Could not extract rate from dataset
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

/**
 * Everything the form needs to show a rate, or null when there is nothing
 * meaningful to show (NOK, no date, no amount, or the lookup failed).
 */
export function exchangeRateDisplayInfo(
  currency: string | undefined,
  expenseDate: Date | undefined,
  amount: number,
  rateDatum: ExchangeRateDatum | null | undefined,
): ExchangeRateDisplayInfo | null {
  if (!currency || currency === "NOK" || !expenseDate || amount <= 0) return null
  if (!rateDatum) return null

  return {
    rate: rateDatum.rate,
    unitMultiplier: rateDatum.unitMultiplier,
    date: rateDatum.rateDate,
    nokAmount: nokAmountFromExchangeRateData(amount, rateDatum),
  }
}

/**
 * Formats the quoted rate. Per-unit quotes need more precision than per-100
 * quotes to stay meaningful.
 */
export function formatExchangeRate(
  rate: number,
  unitMultiplier: number,
): string {
  const fractionDigits = unitMultiplier === 100 ? 2 : 4
  return new Intl.NumberFormat("nb-NO", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(rate)
}

/** Parses "YYYY-MM-DD" into a local midnight Date, avoiding a timezone shift. */
function parseISODateString(str: string): Date {
  const [y, m, d] = str.split("-").map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}
