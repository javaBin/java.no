import { Input } from "@/components/ui/input"
import Image from "next/image"
import React from "react"
import { banks } from "@/data/NorwegianBanks"
import { PiggyBank } from "lucide-react"
import { Controller } from "react-hook-form"
import { validateBankAccount } from "@/lib/expense"
import { useTranslation } from "next-i18next"

type AccountInputBaseProps = Omit<
  React.ComponentProps<typeof Input>,
  "onChange" | "onBlur" | "value" | "name"
> & {
  description?: string
  error?: string
}

const AccountInputBase = React.forwardRef<
  HTMLInputElement,
  AccountInputBaseProps & {
    value: string
    onChange: (value: string) => void
    onBlur: () => void
  }
>(({ value, onChange, onBlur, ...props }, ref) => {
  // Determine if the input is an IBAN (starts with 2 letters)
  const isIBAN = React.useMemo(() => {
    return /^[A-Za-z]{2}/.test(value);
  }, [value]);

  // Find bank based on clearing code (only for Norwegian accounts)
  const bank = React.useMemo(() => {
    if (isIBAN) return null;
    
    const cleanValue = value?.replace(/\D/g, "")
    return (
      banks.find((bank) =>
        bank.clearingCodes.includes(cleanValue?.slice(0, 4)),
      ) || null
    )
  }, [value, isIBAN])

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
      description={bank?.name || (isIBAN ? "IBAN" : undefined)}
      value={value}
      onChange={(e) => {
        let newValue = e.target.value;
        
        // Allow both letters and numbers for all inputs
        // This way users can type either IBAN or BBAN format
        newValue = newValue.replace(/[^a-zA-Z0-9\s]/g, "");
        
        // If it starts with letters, it's likely an IBAN - convert to uppercase
        if (/^[A-Za-z]/.test(newValue)) {
          newValue = newValue.toUpperCase();
          // Max IBAN length is 34 characters
          if (newValue.replace(/\s/g, "").length > 34) return;
        } else {
          // If it starts with numbers, treat as Norwegian account number
          // and only allow digits
          newValue = newValue.replace(/[^0-9\s]/g, "");
          if (newValue.replace(/\s/g, "").length > 11) return;
        }
        
        onChange(newValue);
      }}
      onBlur={() => {
        onBlur()
        const cleanValue = value.replace(/\s/g, "")
        if (!cleanValue) return
        
        if (isIBAN) {
          // Format IBAN with a space every 4 characters
          const formattedIBAN = cleanValue.replace(/(.{4})/g, "$1 ").trim();
          onChange(formattedIBAN);
        } else {
          // Format Norwegian account number as XXXX XX XXXXX
          const cleanDigits = cleanValue.replace(/\D/g, "");
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
export function AccountInput({
  name,
  ...props
}: AccountInputBaseProps & { name: string }) {
  const { t } = useTranslation("common");
  
  return (
    <Controller
      name={name}
      rules={{
        validate: (value) => {
          if (!value) return true
          const cleanValue = value.replace(/\s/g, "")
          return validateBankAccount(cleanValue) || t("expense.errors.invalidAccount")
        },
      }}
      render={({ field, fieldState }) => (
        <AccountInputBase
          {...props}
          {...field}
          error={fieldState.error?.message}
        />
      )}
    />
  )
}

export default AccountInput
