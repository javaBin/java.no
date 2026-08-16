export type ExchangeRateDatum = {
  rate: number
  unitMultiplier: number
  /** The business day the rate is actually quoted for, which may precede the expense date. */
  rateDate: Date
}

export type ExchangeRateDisplayInfo = {
  /** Cross rate: X targetCurrency per 1 sourceCurrency (for calculation) */
  crossRate: number
  /** Original rate from Norges Bank for display */
  sourceRate: number
  sourceUnitMultiplier: number
  targetRate: number
  targetUnitMultiplier: number
  date: Date
  targetAmount: number
  sourceCurrency: string
  targetCurrency: string
}

/**
 * Calculate cross rate from two Norges Bank rates (both relative to NOK).
 */
export function calculateCrossRate(
  fromRate: ExchangeRateDatum,
  toRate: ExchangeRateDatum,
): { rate: number; rateDate: Date; unitMultiplier: number } {
  const fromNormalized = fromRate.rate / fromRate.unitMultiplier
  const toNormalized = toRate.rate / toRate.unitMultiplier
  const crossRate = fromNormalized / toNormalized
  const rateDate =
    fromRate.rateDate > toRate.rateDate ? fromRate.rateDate : toRate.rateDate
  return {
    rate: crossRate,
    rateDate,
    unitMultiplier: 1, // Cross rates are always per-unit
  }
}

/** Converts an amount using the raw Norges Bank rate and its UNIT_MULT. */
export function targetAmountFromExchangeRateData(
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

export type ConversionResult = {
  amount: number
  rate: number
  rateDate: Date
  unitMultiplier: number
  sourceCurrency: string
  targetCurrency: string
}

/**
 * Converts an amount from one currency to another using Norges Bank rates.
 * Since Norges Bank rates are relative to NOK, we calculate the cross rate.
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  expenseDate: Date,
): Promise<ConversionResult | null> {
  // If same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return {
      amount,
      rate: 1,
      rateDate: expenseDate,
      unitMultiplier: 1,
      sourceCurrency: fromCurrency,
      targetCurrency: toCurrency,
    }
  }

  // Fetch both rates relative to NOK
  const [fromRate, toRate] = await Promise.all([
    fetchExchangeRateData(fromCurrency, expenseDate),
    fetchExchangeRateData(toCurrency, expenseDate),
  ])

  if (!fromRate || !toRate) {
    return null
  }

  const crossRate = calculateCrossRate(fromRate, toRate)

  return {
    amount: targetAmountFromExchangeRateData(amount, crossRate),
    rate: crossRate.rate,
    rateDate: crossRate.rateDate,
    unitMultiplier: crossRate.unitMultiplier,
    sourceCurrency: fromCurrency,
    targetCurrency: toCurrency,
  }
}

/**
 * Everything the form needs to show a rate, or null when there is nothing
 * meaningful to show (same currency, no date, no amount, or a lookup failed).
 */
export function exchangeRateDisplayInfo(
  sourceCurrency: string | undefined,
  targetCurrency: string,
  expenseDate: Date | undefined,
  amount: number,
  sourceRate: ExchangeRateDatum | null | undefined,
  targetRate: ExchangeRateDatum | null | undefined,
): ExchangeRateDisplayInfo | null {
  if (!sourceCurrency || !expenseDate || amount <= 0) return null

  // No conversion needed if same currency
  if (sourceCurrency === targetCurrency) return null

  // Need both rates to calculate cross rate
  if (!sourceRate || !targetRate) return null

  const crossRate = calculateCrossRate(sourceRate, targetRate)
  const targetAmount = targetAmountFromExchangeRateData(amount, crossRate)

  return {
    crossRate: crossRate.rate,
    sourceRate: sourceRate.rate,
    sourceUnitMultiplier: sourceRate.unitMultiplier,
    targetRate: targetRate.rate,
    targetUnitMultiplier: targetRate.unitMultiplier,
    date: crossRate.rateDate,
    targetAmount,
    sourceCurrency,
    targetCurrency,
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
