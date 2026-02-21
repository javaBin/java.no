"use client"

import React, { useCallback, useState, forwardRef, useEffect } from "react"

// shadcn
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// utils
import { cn } from "@/lib/utils"

// data
import { currencies as norgesBankCurrencies } from "@/data/currencies"
import { currencies as allCurrenciesData } from "country-data-list"

// assets
import { ChevronDown, CheckIcon, Banknote } from "lucide-react"

export interface Currency {
  code: string
  decimals: number
  name: string
  number: string
  symbol?: string
}

interface CurrencyDropdownProps {
  value?: string
  onValueChange?: (value: string) => void
  onCurrencySelect?: (currency: Currency) => void
  placeholder?: string
  currencies?: "custom" | "all"
  disabled?: boolean
  slim?: boolean
  name?: string
  "data-valid"?: boolean
}

const CurrencyDropdownComponent = (
  {
    value,
    onValueChange,
    onCurrencySelect,
    placeholder = "Select currency",
    currencies = "custom",
    disabled = false,
    slim = false,
    name,
    "data-valid": valid = true,
    ...props
  }: CurrencyDropdownProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) => {
  const [open, setOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<
    Currency | undefined
  >(undefined)

  const uniqueCurrencies = React.useMemo<Currency[]>(() => {
    if (currencies === "custom") {
      return norgesBankCurrencies.map((c) => ({
        code: c.code,
        name: c.name,
        decimals: 2,
        number: "",
        symbol: undefined,
      }))
    }

    const currencyMap = new Map<string, Currency>()
    allCurrenciesData.all.forEach((currency: Currency) => {
      if (
        currency.code &&
        currency.name &&
        currency.symbol &&
        !allCurrencies.includes(currency.code)
      ) {
        const entry: Currency =
          currency.code === "EUR"
            ? {
                code: currency.code,
                name: "Euro",
                symbol: currency.symbol,
                decimals: currency.decimals,
                number: currency.number,
              }
            : {
                code: currency.code,
                name: currency.name,
                symbol: currency.symbol,
                decimals: currency.decimals,
                number: currency.number,
              }
        currencyMap.set(currency.code, entry)
      }
    })

    return Array.from(currencyMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  }, [currencies])

  useEffect(() => {
    if (value) {
      const initial = uniqueCurrencies.find((c) => c.code === value)
      setSelectedCurrency(initial)
    } else {
      setSelectedCurrency(undefined)
    }
  }, [value, uniqueCurrencies])

  const handleSelect = useCallback(
    (currency: Currency) => {
      setSelectedCurrency(currency)
      onValueChange?.(currency.code)
      onCurrencySelect?.(currency)
      setOpen(false)
    },
    [onValueChange, onCurrencySelect],
  )

  const triggerClasses = cn(
    "flex h-9 items-center justify-between gap-1 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
    selectedCurrency ? "w-fit" : "w-full",
    slim && "w-20",
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={ref}
        className={triggerClasses}
        disabled={disabled}
        name={name}
        data-valid={valid}
        {...props}
      >
        {selectedCurrency ? (
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            {selectedCurrency.code}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {slim ? <Banknote size={20} className="shrink-0" /> : placeholder}
          </span>
        )}
        <ChevronDown size={16} className="shrink-0" />
      </PopoverTrigger>
      <PopoverContent
        collisionPadding={10}
        side="bottom"
        className="min-w-[--radix-popper-anchor-width] p-0"
      >
        <Command className="max-h-[200px] w-full sm:max-h-[270px]">
          <CommandList>
            <div className="sticky top-0 z-10 bg-white">
              <CommandInput placeholder="Search currency..." />
            </div>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {uniqueCurrencies.map((currency) => (
                <CommandItem
                  className="flex w-full items-center gap-2"
                  key={currency.code}
                  onSelect={() => handleSelect(currency)}
                >
                  <div className="flex w-0 flex-grow items-center gap-2 overflow-hidden">
                    <span className="w-8 shrink-0 text-left text-sm text-muted-foreground">
                      {currency.code}
                    </span>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {currency.name}
                    </span>
                  </div>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0",
                      selectedCurrency?.code === currency.code
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

CurrencyDropdownComponent.displayName = "CurrencyDropdown"

export const CurrencyDropdown = forwardRef(CurrencyDropdownComponent)
