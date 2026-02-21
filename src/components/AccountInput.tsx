import { Input } from "@/components/ui/input"
import Image from "next/image"
import React from "react"
import { banks } from "@/data/NorwegianBanks"
import {
  buildIBAN,
  getIBANBbanLength,
  validateNorwegianBBAN,
  validateIBAN,
} from "@/lib/expense"
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
  const sanitizeInput = React.useCallback(
    (input: string) => {
      let nextValue = input.replace(/[^a-zA-Z0-9\s]/g, "")
      const previousCompactValue = value.replace(/\s/g, "")
      const compactValue = nextValue.replace(/\s/g, "")
      const isExistingIban = /^[A-Za-z]{2}/.test(previousCompactValue)
      const startsAsIban = /^[A-Za-z]/.test(compactValue)

      // Keep IBAN mode stable while editing an existing IBAN value.
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
          // Format IBAN with a space every 4 characters
          const formattedIBAN = cleanValue
            .toUpperCase()
            .replace(/(.{4})/g, "$1 ")
            .trim()
          onChange(formattedIBAN)
        } else {
          // Format Norwegian account number as XXXX XX XXXXX
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
AccountInputBase.displayName = "AccountInputBase"

/** Norwegian BBAN-only input: 11 digits, format XXXX XX XXXXX, bank image, no IBAN */
const NorwegianAccountInputBase = React.forwardRef<
  HTMLInputElement,
  AccountInputBaseProps & {
    value: string
    onChange: (value: string) => void
    onBlur: () => void
  }
>(({ value, onChange, onBlur, onValidationChange, ...props }, ref) => {
  const sanitizeInput = React.useCallback((input: string) => {
    const nextValue = input.replace(/[^0-9\s]/g, "")
    const compact = nextValue.replace(/\s/g, "")
    if (compact.length > 11) return null
    return nextValue
  }, [])

  const validateAccount = React.useCallback(
    (accountValue: string): AccountValidationResult => {
      const digitsOnly = accountValue.replace(/\s/g, "").replace(/\D/g, "")
      if (!digitsOnly) return { isValid: true }
      if (digitsOnly.length !== 11) {
        return {
          isValid: false,
          errorType: "length",
          expectedLength: 11,
          actualLength: digitsOnly.length,
        }
      }
      if (!validateNorwegianBBAN(digitsOnly)) {
        return { isValid: false, errorType: "format" }
      }
      return { isValid: true }
    },
    [],
  )

  const bank = React.useMemo(() => {
    const cleanValue = value?.replace(/\D/g, "")
    return (
      banks.find((b) => b.clearingCodes.includes(cleanValue?.slice(0, 4))) ||
      null
    )
  }, [value])

  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
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
      description={bank?.name}
      value={value}
      onChange={(e) => {
        const newValue = sanitizeInput(e.target.value)
        if (newValue === null) return
        onChange(newValue)
      }}
      onBlur={() => {
        onBlur()
        const cleanValue = value.replace(/\s/g, "").replace(/\D/g, "")
        if (!cleanValue) return
        const validationResult = validateAccount(value)
        onValidationChange?.(validationResult)
        const formatted = `${cleanValue.slice(0, 4)} ${cleanValue.slice(4, 6)} ${cleanValue.slice(6)}`
        onChange(formatted)
      }}
      placeholder="e.g. 8601 11 17947"
    />
  )
})
NorwegianAccountInputBase.displayName = "NorwegianAccountInputBase"

export function NorwegianAccountInput({
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
    <NorwegianAccountInputBase
      {...props}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onValidationChange={onValidationChange}
    />
  )
}

/** IBAN input: country from selector (prefix), digits only. Builds full IBAN on change. */
type IbanAccountInputProps = AccountInputBaseProps & {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  onValidationChange?: (result: AccountValidationResult) => void
  countryIso2: string
}

const IbanAccountInputBase = React.forwardRef<
  HTMLInputElement,
  IbanAccountInputProps
>(
  (
    { value, onChange, onBlur, onValidationChange, countryIso2, ...props },
    ref,
  ) => {
    const bbanLength = getIBANBbanLength(countryIso2) ?? 18
    const bbanFromValue = React.useMemo(() => {
      const clean = (value || "").replace(/\s/g, "")
      if (clean.length > 4 && /^[A-Z]{2}[0-9]{2}/.test(clean)) {
        return clean.slice(4).replace(/\D/g, "")
      }
      return ""
    }, [value])

    const sanitize = React.useCallback(
      (input: string) => {
        const digits = input.replace(/\D/g, "")
        return digits.slice(0, bbanLength)
      },
      [bbanLength],
    )

    const validate = React.useCallback(
      (fullIban: string): AccountValidationResult => {
        const clean = fullIban.replace(/\s/g, "")
        if (!clean) return { isValid: true }
        if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) {
          return { isValid: false, errorType: "format" }
        }
        const expected = bbanLength + 4
        if (clean.length !== expected) {
          return {
            isValid: false,
            errorType: "length",
            expectedLength: expected,
            actualLength: clean.length,
          }
        }
        if (!validateIBAN(clean)) return { isValid: false, errorType: "format" }
        return { isValid: true }
      },
      [bbanLength],
    )

    const displayValue = bbanFromValue.replace(/(.{4})/g, "$1 ").trim()

    return (
      <div className="flex w-full items-center gap-2">
        <span
          className="flex h-9 shrink-0 items-center rounded-md border border-neutral-200 bg-neutral-50 px-2.5 text-sm font-medium text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
          aria-hidden
        >
          {countryIso2.toUpperCase()}
        </span>
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          placeholder={props.placeholder ?? "e.g. 8601 11 17947"}
          description={props.description}
          onChange={(e) => {
            const digits = sanitize(e.target.value)
            const fullIban = buildIBAN(countryIso2, digits)
            onChange(fullIban || "")
          }}
          onBlur={() => {
            onBlur()
            const fullIban = (value || "").replace(/\s/g, "")
            if (!fullIban) return
            const result = validate(fullIban)
            onValidationChange?.(result)
            if (result.isValid && bbanFromValue) {
              const formatted = buildIBAN(countryIso2, bbanFromValue)
              if (formatted) onChange(formatted)
            }
          }}
        />
      </div>
    )
  },
)
IbanAccountInputBase.displayName = "IbanAccountInputBase"

export function IbanAccountInput({
  value,
  onChange,
  onBlur,
  onValidationChange,
  countryIso2,
  ...props
}: IbanAccountInputProps) {
  return (
    <IbanAccountInputBase
      {...props}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onValidationChange={onValidationChange}
      countryIso2={countryIso2}
    />
  )
}

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
