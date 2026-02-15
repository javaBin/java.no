import { Input } from "@/components/ui/input"
import Image from "next/image"
import React from "react"
import { banks } from "@/data/NorwegianBanks"
import { PiggyBank } from "lucide-react"

// IBAN country code to country name and expected length
const ibanCountries: Record<string, { name: string; length: number }> = {
  NO: { name: "Norwegian", length: 15 },
  SE: { name: "Swedish", length: 24 },
  DK: { name: "Danish", length: 18 },
  FI: { name: "Finnish", length: 18 },
  DE: { name: "German", length: 22 },
  GB: { name: "British", length: 22 },
  FR: { name: "French", length: 27 },
  NL: { name: "Dutch", length: 18 },
  AT: { name: "Austrian", length: 20 },
  BE: { name: "Belgian", length: 16 },
  ES: { name: "Spanish", length: 24 },
  IT: { name: "Italian", length: 27 },
  PT: { name: "Portuguese", length: 25 },
  CH: { name: "Swiss", length: 21 },
}

function getIbanInfo(
  accountValue: string,
): { countryName: string; expectedLength: number } | null {
  const cleanValue = accountValue.replace(/\s/g, "").toUpperCase()
  const match = cleanValue.match(/^([A-Z]{2})/)
  if (!match || !match[1]) return null

  const countryCode: string = match[1]
  const info = ibanCountries[countryCode]
  if (!info) return null

  return { countryName: info.name, expectedLength: info.length }
}

type AccountInputBaseProps = Omit<
  React.ComponentProps<typeof Input>,
  "onChange" | "onBlur" | "value" | "name"
> & {
  description?: string
  error?: string
  onValidationChange?: (result: AccountValidationResult) => void
}

export type AccountValidationResult = {
  isValid: boolean
  errorType?: "country" | "length" | "format" | "unknown"
  expectedLength?: number
  actualLength?: number
  countryName?: string
}

const AccountInputBase = React.forwardRef<
  HTMLInputElement,
  AccountInputBaseProps & {
    value: string
    onChange: (value: string) => void
    onBlur: () => void
  }
>(({ value, onChange, onBlur, onValidationChange, ...props }, ref) => {
  // Validate Norwegian BBAN (11 digits) or IBAN (starts with country code, 15-34 chars)
  const validateAccount = React.useCallback(
    (accountValue: string): AccountValidationResult => {
      const cleanValue = accountValue.replace(/\s/g, "")

      if (!cleanValue) return { isValid: true } // Empty is valid (handled by required field)

      // Check if IBAN (starts with letters)
      if (/^[A-Za-z]{2}/.test(cleanValue)) {
        const ibanWithoutSpaces = cleanValue.replace(/\s/g, "")

        // Try to get country-specific validation
        const ibanInfo = getIbanInfo(cleanValue)

        // First check: format (country code + check digits + alphanumeric)
        if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(ibanWithoutSpaces)) {
          return {
            isValid: false,
            errorType: "format",
            countryName: ibanInfo?.countryName,
          }
        }

        if (ibanInfo) {
          // Country-specific validation - check length matches expected
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

        // Fallback for unknown countries: basic IBAN length check
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
        // Norwegian BBAN: exactly 11 digits
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

  // Determine if the input is an IBAN (starts with 2 letters)
  const isIBAN = React.useMemo(() => {
    return /^[A-Za-z]{2}/.test(value)
  }, [value])

  // Find bank based on clearing code (only for Norwegian accounts)
  const bank = React.useMemo(() => {
    if (isIBAN) return null

    const cleanValue = value?.replace(/\D/g, "")
    return (
      banks.find((bank) =>
        bank.clearingCodes.includes(cleanValue?.slice(0, 4)),
      ) || null
    )
  }, [value, isIBAN])

  // Get IBAN country info for description
  const ibanInfo = React.useMemo(() => {
    if (!isIBAN) return null
    return getIbanInfo(value)
  }, [value, isIBAN])

  // Determine description to show
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
      startIcon={
        bank ? (
          <Image
            src={`/bank/${bank.identifier}.png`}
            alt={`${bank.name} logo`}
            width={30}
            height={30}
            className="object-contain"
          />
        ) : (
          <PiggyBank
            size="1rem"
            className="absolute left-2 top-1/2 -translate-y-1/2 transform"
          />
        )
      }
      description={description}
      value={value}
      onChange={(e) => {
        let newValue = e.target.value

        // Allow both letters and numbers for all inputs
        // This way users can type either IBAN or BBAN format
        newValue = newValue.replace(/[^a-zA-Z0-9\s]/g, "")

        // If it starts with letters, it's likely an IBAN - convert to uppercase
        if (/^[A-Za-z]/.test(newValue)) {
          newValue = newValue.toUpperCase()
          // Max IBAN length is 34 characters
          if (newValue.replace(/\s/g, "").length > 34) return
        } else {
          // If it starts with numbers, treat as Norwegian account number
          // and only allow digits
          newValue = newValue.replace(/[^0-9\s]/g, "")
          if (newValue.replace(/\s/g, "").length > 11) return
        }

        onChange(newValue)

        // Run validation on change so "only letters" etc. show invalid immediately
        const validationResult = validateAccount(newValue)
        onValidationChange?.(validationResult)
      }}
      onBlur={() => {
        onBlur()
        const cleanValue = value.replace(/\s/g, "")
        if (!cleanValue) return

        const validationResult = validateAccount(value)
        onValidationChange?.(validationResult)

        if (isIBAN) {
          // Format IBAN with a space every 4 characters
          const formattedIBAN = cleanValue.replace(/(.{4})/g, "$1 ").trim()
          onChange(formattedIBAN)
        } else {
          // Format Norwegian account number as XXXX XX XXXXX
          const cleanDigits = cleanValue.replace(/\D/g, "")
          onChange(
            `${cleanDigits.slice(0, 4)} ${cleanDigits.slice(4, 6)} ${cleanDigits.slice(6)}`,
          )
        }
      }}
      onFocus={(e) => {
        const value = e.currentTarget.value
        onChange(value.replace(/\s/g, ""))
      }}
      placeholder="e.g. 8601 11 17947 or NO93 8601 1117 947"
    />
  )
})
AccountInputBase.displayName = "AccountInputBase"

// Export the controlled version for use with React Hook Form
// Used inside FormField - validation is handled by the Zod schema
export function AccountInput({
  value,
  onChange,
  onBlur,
  onValidationChange,
  ...props
}: AccountInputBaseProps & {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  onValidationChange?: (result: AccountValidationResult) => void
}) {
  return (
    <AccountInputBase
      {...props}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onValidationChange={onValidationChange}
    />
  )
}

export default AccountInput
