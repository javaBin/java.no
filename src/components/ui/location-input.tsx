import React, { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
// Import JSON data directly
import countries from "@/data/countries.json"

interface Timezone {
  zoneName: string
  gmtOffset: number
  gmtOffsetName: string
  abbreviation: string
  tzName: string
}

interface CountryProps {
  id: number
  name: string
  iso3: string
  iso2: string
  numeric_code: string
  phone_code: string
  capital: string
  currency: string
  currency_name: string
  currency_symbol: string
  tld: string
  native: string
  region: string
  region_id: string
  subregion: string
  subregion_id: string
  nationality: string
  timezones: Timezone[]
  translations: Record<string, string>
  latitude: string
  longitude: string
  emoji: string
  emojiU: string
}

interface LocationSelectorProps {
  disabled?: boolean
  defaultValue?: string | null
  onCountryChange?: (country: CountryProps | null) => void
}

const LocationSelector = ({
  disabled,
  defaultValue = null,
  onCountryChange,
}: LocationSelectorProps) => {
  // Cast imported JSON data to their respective types
  const countriesData = countries as CountryProps[]

  const [selectedCountry, setSelectedCountry] = useState<CountryProps | null>(
    defaultValue
      ? countriesData.find(
          (country) =>
            country.name.toLowerCase() === defaultValue.toLowerCase(),
        ) || null
      : null,
  )
  const [openCountryDropdown, setOpenCountryDropdown] = useState(false)

  const handleCountrySelect = (country: CountryProps | null) => {
    setSelectedCountry(country)
    onCountryChange?.(country)
  }

  return (
    <div className="flex gap-4">
      {/* Country Selector */}
      <Popover open={openCountryDropdown} onOpenChange={setOpenCountryDropdown}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openCountryDropdown}
            disabled={disabled}
            className="w-full justify-between"
          >
            {selectedCountry ? (
              <div className="flex items-center gap-2">
                <span>{selectedCountry.emoji}</span>
                <span>{selectedCountry.name}</span>
              </div>
            ) : (
              <span>Select Country...</span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countriesData.map((country) => (
                  <CommandItem
                    key={country.id}
                    value={country.name}
                    onSelect={() => {
                      handleCountrySelect(country)
                      setOpenCountryDropdown(false)
                    }}
                    className="flex cursor-pointer items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span>{country.emoji}</span>
                      <span>{country.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default LocationSelector
