import type { Input } from "@/components/ui/input"
import type React from "react"

export type AccountValidationResult = {
  isValid: boolean
  errorType?: "country" | "length" | "format" | "checksum" | "unknown"
  expectedLength?: number
  actualLength?: number
  countryName?: string
}

export type AccountInputBaseProps = Omit<
  React.ComponentProps<typeof Input>,
  "onChange" | "onBlur" | "value" | "name"
> & {
  description?: string
  error?: string
  onValidationChange?: (result: AccountValidationResult) => void
}
