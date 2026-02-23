import React from "react"
import { countries } from "country-data-list"
import { Input } from "@/components/ui/input"
import { buildIBAN, getIBANBbanLength, validateIBAN } from "@/lib/expense"
import type { AccountInputBaseProps, AccountValidationResult } from "./types"

type IbanAccountInputProps = AccountInputBaseProps & {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  onValidationChange?: (result: AccountValidationResult) => void
  countryIso2: string
}

export const IbanAccountInput = React.forwardRef<
  HTMLInputElement,
  IbanAccountInputProps
>(function IbanAccountInput(
  { value, onChange, onBlur, onValidationChange, countryIso2, ...props },
  ref,
) {
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

  const countryName = React.useMemo(() => {
    const c = countries.all.find(
      (c: { alpha2: string }) =>
        c.alpha2 === countryIso2.toUpperCase(),
    )
    return (c?.name as string) ?? countryIso2.toUpperCase()
  }, [countryIso2])

  const validate = React.useCallback(
    (fullIban: string): AccountValidationResult => {
      const clean = fullIban.replace(/\s/g, "")
      if (!clean) return { isValid: true }
      if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) {
        return { isValid: false, errorType: "format", countryName }
      }
      const expected = bbanLength + 4
      if (clean.length !== expected) {
        return {
          isValid: false,
          errorType: "length",
          expectedLength: expected,
          actualLength: clean.length,
          countryName,
        }
      }
      if (!validateIBAN(clean)) {
        return { isValid: false, errorType: "format", countryName }
      }
      return { isValid: true }
    },
    [bbanLength, countryName],
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
          if (!bbanFromValue) return
          const composed = buildIBAN(countryIso2, bbanFromValue)
          if (composed) onChange(composed)
          const result = validate(composed || (value || "").replace(/\s/g, ""))
          onValidationChange?.(result)
        }}
      />
    </div>
  )
})
