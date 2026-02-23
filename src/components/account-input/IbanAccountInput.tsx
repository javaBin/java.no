import React from "react"
import { NumberFormatBase } from "react-number-format"
import { getIBANBbanLength, validateIBAN } from "@/lib/expense"
import type { AccountInputBaseProps, AccountValidationResult } from "./types"

type IbanAccountInputProps = AccountInputBaseProps & {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  onValidationChange?: (result: AccountValidationResult) => void
  countryIso2: string
}

function ibanFormat(value: string) {
  const clean = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
  return clean.replace(/(.{4})/g, "$1 ").trim()
}

function ibanRemoveFormatting(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
}

function ibanIsValidInputCharacter(char: string) {
  return /^[a-zA-Z0-9]$/.test(char)
}

export const IbanAccountInput = React.forwardRef<
  HTMLInputElement,
  IbanAccountInputProps
>(function IbanAccountInput(
  { value, onChange, onBlur, onValidationChange, countryIso2, ...props },
  ref,
) {
  const expectedLength = React.useMemo(() => {
    const bbanLen = getIBANBbanLength(countryIso2)
    return bbanLen != null ? bbanLen + 4 : null
  }, [countryIso2])

  const validate = React.useCallback(
    (iban: string): AccountValidationResult => {
      const clean = iban.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
      if (!clean) return { isValid: true }
      if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) {
        return { isValid: false, errorType: "format" }
      }
      if (expectedLength && clean.length !== expectedLength) {
        return {
          isValid: false,
          errorType: "length",
          expectedLength,
          actualLength: clean.length,
        }
      }
      if (!validateIBAN(clean)) {
        return { isValid: false, errorType: "checksum" }
      }
      return { isValid: true }
    },
    [expectedLength],
  )

  const rawValue = (value || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()

  return (
    <NumberFormatBase
      getInputRef={ref}
      value={rawValue}
      format={ibanFormat}
      removeFormatting={ibanRemoveFormatting}
      isValidInputCharacter={ibanIsValidInputCharacter}
      getCaretBoundary={(formattedValue) => {
        const boundary = Array(formattedValue.length + 1)
        for (let i = 0; i <= formattedValue.length; i++) {
          boundary[i] = i === formattedValue.length || formattedValue[i] !== " "
        }
        return boundary
      }}
      isAllowed={(values) => {
        const maxLen = expectedLength ?? 34
        return values.value.length <= maxLen
      }}
      onValueChange={(values) => {
        onChange(values.value.toUpperCase())
      }}
      onBlur={() => {
        onBlur()
        if (rawValue) {
          onValidationChange?.(validate(rawValue))
        }
      }}
      type="text"
      placeholder={
        (props.placeholder as string | undefined) ??
        "e.g. NO93 8601 1117 947"
      }
      className="flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm uppercase shadow-sm transition-colors placeholder:text-neutral-500 placeholder:normal-case focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
    />
  )
})
