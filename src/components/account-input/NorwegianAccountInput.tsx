import React from "react"
import { NumberFormatBase } from "react-number-format"
import { banks } from "@/data/NorwegianBanks"
import {
  formatNorwegianBBANForDisplay,
  validateNorwegianBBAN,
} from "@/lib/expense"
import { BankLogo } from "./BankLogo"
import type { AccountInputBaseProps, AccountValidationResult } from "./types"

const NORWEGIAN_BBAN_LENGTH = 11

function bbanRemoveFormatting(value: string) {
  return value.replace(/\s+/g, "").replace(/\D/g, "")
}

function bbanIsValidInputCharacter(char: string) {
  return /^[0-9]$/.test(char)
}

function bbanGetCaretBoundary(value: string) {
  return Array.from({ length: value.length + 1 }, () => true)
}

/** Norwegian BBAN-only input: 11 digits, mask XXXX XX XXXXX, bank logo, no IBAN */
export const NorwegianAccountInput = React.forwardRef<
  HTMLInputElement,
  AccountInputBaseProps & {
    value: string
    onChange: (value: string) => void
    onBlur: () => void
    onValidationChange?: (result: AccountValidationResult) => void
  }
>(function NorwegianAccountInput(
  {
    value,
    onChange,
    onBlur,
    onValidationChange,
    defaultValue: _defaultValue,
    ...props
  },
  ref,
) {
  const rawDigits = (value || "").replace(/\D/g, "")

  const bank = React.useMemo(() => {
    return (
      banks.find((b) => b.clearingCodes.includes(rawDigits.slice(0, 4))) ||
      null
    )
  }, [rawDigits])

  const validate = React.useCallback(
    (digits: string): AccountValidationResult => {
      if (!digits) return { isValid: true }
      if (digits.length !== NORWEGIAN_BBAN_LENGTH) {
        return {
          isValid: false,
          errorType: "length",
          expectedLength: NORWEGIAN_BBAN_LENGTH,
          actualLength: digits.length,
        }
      }
      if (!validateNorwegianBBAN(digits)) {
        return { isValid: false, errorType: "format" }
      }
      return { isValid: true }
    },
    [],
  )

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2">
          <BankLogo bank={bank} />
        </div>
        <NumberFormatBase
          {...props}
          getInputRef={ref}
          value={rawDigits}
          format={formatNorwegianBBANForDisplay}
          removeFormatting={bbanRemoveFormatting}
          isValidInputCharacter={bbanIsValidInputCharacter}
          getCaretBoundary={bbanGetCaretBoundary}
          onValueChange={(values) => onChange(values.value)}
          onBlur={() => {
            onBlur()
            if (rawDigits) {
              onValidationChange?.(validate(rawDigits))
            }
          }}
          type="text"
          inputMode="numeric"
          placeholder={
            (props.placeholder as string | undefined) ?? "e.g. 8601 11 17947"
          }
          className="flex h-9 w-full rounded-md border border-neutral-200 bg-transparent py-1 text-sm shadow-sm transition-colors placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300 pl-10"
          style={{ paddingLeft: "3rem" }}
        />
      </div>
      {bank?.name && (
        <p className="mt-2 text-sm text-neutral-500">{bank.name}</p>
      )}
    </div>
  )
})
