import React from "react"
import { countrySpecs } from "ibantools"
import { countries } from "country-data-list"
import { Input } from "@/components/ui/input"
import { banks } from "@/data/NorwegianBanks"
import { BankLogo } from "./BankLogo"
import type { AccountInputBaseProps, AccountValidationResult } from "./types"

function getIbanCountryInfo(
  accountValue: string,
): { countryName: string; expectedLength: number } | null {
  const clean = accountValue.replace(/\s/g, "").toUpperCase()
  const cc = clean.slice(0, 2)
  if (!/^[A-Z]{2}$/.test(cc)) return null

  const spec = countrySpecs[cc]
  if (!spec?.chars) return null

  const country = countries.all.find(
    (c: { alpha2: string }) => c.alpha2 === cc,
  )

  return {
    countryName: (country?.name as string) ?? cc,
    expectedLength: spec.chars,
  }
}

/** Combined input that auto-detects Norwegian BBAN (digits) vs IBAN (starts with letters). */
export const AccountInput = React.forwardRef<
  HTMLInputElement,
  AccountInputBaseProps & {
    value: string
    onChange: (value: string) => void
    onBlur: () => void
    onValidationChange?: (result: AccountValidationResult) => void
  }
>(function AccountInput(
  { value, onChange, onBlur, onValidationChange, ...props },
  ref,
) {
  const sanitizeInput = React.useCallback(
    (input: string) => {
      let nextValue = input.replace(/[^a-zA-Z0-9\s]/g, "")
      const previousCompactValue = value.replace(/\s/g, "")
      const compactValue = nextValue.replace(/\s/g, "")
      const isExistingIban = /^[A-Za-z]{2}/.test(previousCompactValue)
      const startsAsIban = /^[A-Za-z]/.test(compactValue)

      if (isExistingIban || startsAsIban) {
        if (compactValue.length > 34) return null
      } else if (/^\d/.test(compactValue)) {
        if (compactValue.length > 11) return null
        nextValue = nextValue.replace(/[^0-9\s]/g, "")
      }

      return nextValue
    },
    [value],
  )

  const validateAccount = React.useCallback(
    (accountValue: string): AccountValidationResult => {
      const cleanValue = accountValue.replace(/\s/g, "")
      if (!cleanValue) return { isValid: true }

      if (/^[A-Za-z]{2}/.test(cleanValue)) {
        const ibanWithoutSpaces = cleanValue.replace(/\s/g, "")
        const ibanInfo = getIbanCountryInfo(cleanValue)

        if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(ibanWithoutSpaces)) {
          return {
            isValid: false,
            errorType: "format",
            countryName: ibanInfo?.countryName,
          }
        }

        if (ibanInfo) {
          if (ibanWithoutSpaces.length !== ibanInfo.expectedLength) {
            return {
              isValid: false,
              errorType: "length",
              expectedLength: ibanInfo.expectedLength,
              actualLength: ibanWithoutSpaces.length,
              countryName: ibanInfo.countryName,
            }
          }
          return { isValid: true }
        }

        if (ibanWithoutSpaces.length < 15 || ibanWithoutSpaces.length > 34) {
          return {
            isValid: false,
            errorType: "length",
            expectedLength: undefined,
            actualLength: ibanWithoutSpaces.length,
          }
        }

        return { isValid: true }
      } else {
        const digitsOnly = cleanValue.replace(/\D/g, "")
        if (digitsOnly.length !== 11) {
          return {
            isValid: false,
            errorType: "length",
            expectedLength: 11,
            actualLength: digitsOnly.length,
          }
        }
        return { isValid: true }
      }
    },
    [],
  )

  const isIBAN = React.useMemo(() => {
    return /^[A-Za-z]{2}/.test(value)
  }, [value])

  const bank = React.useMemo(() => {
    if (isIBAN) return null
    const cleanValue = value?.replace(/\D/g, "")
    return (
      banks.find((bank) =>
        bank.clearingCodes.includes(cleanValue?.slice(0, 4)),
      ) || null
    )
  }, [value, isIBAN])

  const ibanInfo = React.useMemo(() => {
    if (!isIBAN) return null
    return getIbanCountryInfo(value)
  }, [value, isIBAN])

  const description = React.useMemo(() => {
    if (bank) return bank.name
    if (isIBAN && ibanInfo) {
      return `${ibanInfo.countryName} IBAN detected (validating length: ${ibanInfo.expectedLength})`
    }
    if (isIBAN) return "IBAN detected"
    return undefined
  }, [bank, isIBAN, ibanInfo])

  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      startIcon={<BankLogo bank={bank} />}
      description={description}
      value={value}
      onChange={(e) => {
        const newValue = sanitizeInput(e.target.value)
        if (newValue === null) return
        onChange(newValue)
      }}
      onBlur={() => {
        onBlur()
        const cleanValue = value.replace(/\s/g, "")
        if (!cleanValue) return

        const validationResult = validateAccount(value)
        onValidationChange?.(validationResult)

        if (isIBAN) {
          const formattedIBAN = cleanValue
            .toUpperCase()
            .replace(/(.{4})/g, "$1 ")
            .trim()
          onChange(formattedIBAN)
        } else {
          const cleanDigits = cleanValue.replace(/\D/g, "")
          onChange(
            `${cleanDigits.slice(0, 4)} ${cleanDigits.slice(4, 6)} ${cleanDigits.slice(6)}`,
          )
        }
      }}
      placeholder="e.g. 8601 11 17947 or NO93 8601 1117 947"
    />
  )
})
