"use client"

import React, { useEffect } from "react"
import { UseFormReturn, useWatch } from "react-hook-form"
import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  IbanAccountInput,
  NorwegianAccountInput,
  type AccountValidationResult,
} from "@/components/AccountInput"
import { getBankCountryType } from "@/lib/expense"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Country, CountryDropdown } from "./ui/country-dropdown"

type BankDetailsFormProps = {
  form: UseFormReturn<any>
  t: (key: string) => string
  language: string
  onValidationChange?: (result: AccountValidationResult) => void
  isInternational: boolean
}

export function BankDetailsForm({
  form,
  t,
  language,
  onValidationChange,
  isInternational,
}: BankDetailsFormProps) {
  const bankCountryIso2 = useWatch({
    control: form.control,
    name: "bankCountryIso2",
  })
  const type = getBankCountryType(bankCountryIso2 || "")
  const previousTypeRef = React.useRef(type)

  useEffect(() => {
    if (previousTypeRef.current === type) return
    previousTypeRef.current = type

    if (type === "sepa") {
      form.setValue("bankRoutingNumber", "")
      form.setValue("bankAccountNumber", "")
      form.setValue("bankSwiftBic", "")
      form.setValue("bankName", "")
      form.setValue("bankAddress", "")
      form.setValue("bankAccountHolderName", "")
    } else if (type === "us") {
      form.setValue("bankIban", "")
    }
  }, [type, form])

  const prevBankCountryIso2Ref = React.useRef(bankCountryIso2)
  useEffect(() => {
    if (type !== "sepa") return
    if (prevBankCountryIso2Ref.current === bankCountryIso2) return
    prevBankCountryIso2Ref.current = bankCountryIso2 || ""
    const iban = (form.getValues("bankIban") || "").replace(/\s/g, "")
    const ibanCountry = iban.slice(0, 2).toUpperCase()
    if (
      iban.length >= 4 &&
      ibanCountry !== (bankCountryIso2 || "").toUpperCase()
    ) {
      form.setValue("bankIban", "")
    }
  }, [type, bankCountryIso2, form])

  if (!isInternational) {
    return (
      <FormField
        control={form.control}
        name="bankAccountNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("expense.bankAccountNumber")}</FormLabel>
            <FormControl>
              <NorwegianAccountInput
                {...field}
                placeholder={t("expense.bankAccountNumberPlaceholder")}
                onValidationChange={(result) => {
                  onValidationChange?.(result)
                  if (result.isValid) form.clearErrors("bankAccountNumber")
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="bankCountry"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("expense.bankCountry")}</FormLabel>
            <FormControl>
              <CountryDropdown
                defaultValue={field.value}
                onChange={(country: Country) => {
                  field.onChange(country?.alpha3 ?? "")
                  form.setValue("bankCountryIso2", country?.alpha2 || "")
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {type === "sepa" && (
        <>
          <FormField
            control={form.control}
            name="bankIban"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankIban")}</FormLabel>
                <FormControl>
                  <IbanAccountInput
                    {...field}
                    countryIso2={bankCountryIso2 || ""}
                    placeholder={t("expense.bankIbanPlaceholder")}
                    onValidationChange={(result) => {
                      onValidationChange?.(result)
                      if (result.isValid) form.clearErrors("bankIban")
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankSwiftBic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankSwiftBic")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. DNBANOKK"
                    className="uppercase"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      {type === "us" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="bankRoutingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("expense.bankRoutingNumber")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. 021000021"
                      inputMode="numeric"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankAccountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("expense.bankAccountNumber")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. 1234567890" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="bankAccountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankAccountType")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="checking">
                      {t("expense.bankAccountTypeChecking")}
                    </SelectItem>
                    <SelectItem value="savings">
                      {t("expense.bankAccountTypeSavings")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankSwiftBic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankSwiftBic")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. CHASUS33"
                    className="uppercase"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankName")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Chase Bank" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankAddress")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. 123 Main St, New York, NY 10001"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankAccountHolderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankAccountHolderName")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("expense.namePlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      {type === "other" && (
        <>
          <FormField
            control={form.control}
            name="bankAccountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankAccountNumber")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Account or IBAN" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankSwiftBic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankSwiftBic")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. DEUTDEFF"
                    className="uppercase"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankName")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankAddress")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankAccountHolderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.bankAccountHolderName")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("expense.namePlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  )
}
