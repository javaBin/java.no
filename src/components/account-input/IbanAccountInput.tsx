import React from "react"
import { NumberFormatBase } from "react-number-format"
import {
  formatIBANForDisplay,
  getIBANBbanLength,
  validateIBAN,
} from "@/lib/expense"
import type { AccountInputBaseProps, AccountValidationResult } from "./types"

type IbanAccountInputProps = AccountInputBaseProps & {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  onValidationChange?: (result: AccountValidationResult) => void
  countryIso2: string
}

function ibanRemoveFormatting(value: string) {
  return value.replace(/\s+/gi, "").replace(/[^a-z0-9]/gi, "").toUpperCase()
}

function ibanIsValidInputCharacter(char: string) {
  return /^[a-z0-9]$/i.test(char)
}

// Allow caret at every position (like docs) for better typing
function ibanGetCaretBoundary(value: string) {
  return Array.from({ length: value.length + 1 }, () => true)
}

export const IbanAccountInput = React.forwardRef<
  HTMLInputElement,
  IbanAccountInputProps
>(function IbanAccountInput(
  {
    value,
    onChange,
    onBlur,
    onValidationChange,
    countryIso2,
    defaultValue: _defaultValue,
    ...props
  },
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
      {...props}
      getInputRef={ref}
      value={rawValue}
      format={formatIBANForDisplay}
      removeFormatting={ibanRemoveFormatting}
      isValidInputCharacter={ibanIsValidInputCharacter}
      getCaretBoundary={ibanGetCaretBoundary}
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
