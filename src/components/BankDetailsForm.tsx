"use client"

import React, { useEffect } from "react"
import { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import LocationInput from "@/components/ui/location-input"
import AccountInput, { type AccountValidationResult } from "@/components/AccountInput"
import { getBankCountryType } from "@/lib/expense"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type BankDetailsFormProps = {
  form: UseFormReturn<any>
  t: (key: string) => string
  language: string
  /** When validation fails and user chose to skip, hide validation errors for bank fields */
  skipAccountValidation?: boolean
  onValidationChange?: (result: AccountValidationResult) => void
}

export function BankDetailsForm({
  form,
  t,
  language,
  skipAccountValidation,
  onValidationChange,
}: BankDetailsFormProps) {
  const bankCountryIso2 = form.watch("bankCountryIso2")
  const type = getBankCountryType(bankCountryIso2 || "")

  // Clear conditional fields when switching country type to avoid submitting stale data
  useEffect(() => {
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

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="bankCountry"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("expense.bankCountry")}</FormLabel>
            <FormControl>
              <LocationInput
                defaultValue={field.value}
                onCountryChange={(country) => {
                  field.onChange(country?.name ?? "")
                  form.setValue("bankCountryIso2", country?.iso2 ?? "")
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {type === "sepa" && (
        <FormField
          control={form.control}
          name="bankIban"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("expense.bankIban")}</FormLabel>
              <FormControl>
                <AccountInput
                  {...field}
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
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
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
                  <Input {...field} placeholder={t("expense.namePlaceholder")} />
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
            name="bankIban"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn("text-muted-foreground")}>
                  {t("expense.bankIban")} ({language === "no" ? "valgfritt" : "optional"})
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("expense.bankIbanPlaceholder")}
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
                  <Input {...field} placeholder={t("expense.namePlaceholder")} />
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
