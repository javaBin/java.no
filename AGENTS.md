# java.no - Agent Guidelines

## Overview

**java.no** is the website for the Norwegian Java User Group (javaBin). It's a community site for Java developers in Norway, featuring regional meetup information, an expense reimbursement system, and board/contact pages.

## Tech Stack

| Category        | Technology                                                                 |
| --------------- | -------------------------------------------------------------------------- |
| Framework       | Next.js 16 (Pages Router)                                                  |
| Language        | TypeScript (strict mode)                                                   |
| Styling         | Tailwind CSS + Shadcn UI; base/typography in `src/styles/globals.css`      |
| Package Manager | pnpm                                                                       |
| i18n            | next-i18next (Norwegian/English)                                          |
| Form Handling   | React Hook Form + Zod                                                      |
| Validation      | Zod                                                                        |
| URL state       | nuqs (NuqsAdapter in `_app.tsx`)                                          |

UI is Tailwind + Shadcn UI.

## Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server

# Linting
pnpm lint         # Run ESLint
pnpm lint --fix   # Run ESLint with auto-fix
```

With **Mise**: `mise run dev` | `mise run build` | `mise run start` (see `mise.toml`).

No test suite at the moment.

## Code Style Guidelines

### TypeScript

- **Strict mode** with `noUncheckedIndexedAccess` (see `tsconfig.json`)
- Use explicit types for function parameters and return types
- Co-locate types with components when specific to that component
- Use interfaces for object shapes; use Zod for form/API validation schemas

### Imports

- Use path alias `@/*` → `src/*`: `@/components/*`, `@/lib/*`, `@/data/*`
- Order: external libs → internal `@/` aliases → relative imports
- Example:
  ```ts
  import { useState } from "react"
  import { z } from "zod"
  import { useTranslation } from "next-i18next"
  import { Button } from "@/components/ui/button"
  import { cn } from "@/lib/utils"
  import { RegionCard } from "@/components/Region"
  ```

### Naming Conventions

- **Components**: PascalCase (`BankDetailsForm.tsx`, `RegionCard`, `Footer.tsx`)
- **Hooks**: camelCase with `use` prefix (`useToast`, `useControllableState`)
- **Utilities**: camelCase (`formatCurrency`, `getBankCountryType`)
- **Types/Interfaces**: PascalCase (`Meeting`, `BankDetailsFormProps`)
- **Files**: kebab-case for utilities (`meetup-scraper.ts`), PascalCase for components

### Formatting

- Prettier (Tailwind plugin); format with `pnpm exec prettier --write .`
- Prefer 80-char line width and no semicolons if project Prettier config uses them
- Tailwind: use logical properties and group related classes
- Example:
  ```tsx
  <div className="flex flex-col space-y-3 rounded-lg bg-white p-4 shadow-sm">
    {/* content */}
  </div>
  ```

### Components

- Use `"use client"` for client-only components
- Use TypeScript interfaces/types for props
- Destructure props when simple:
  ```ts
  type Props = { region: RegionWithEvents }
  export const RegionCard = ({ region }: Props) => { ... }
  ```

### Forms (React Hook Form + Zod)

- Use the shadcn/ui Form pattern with `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- Zod schemas with localized errors: `createExpenseSchemas(t, language)` in `@/lib/expense`
- Use `useWatch` from react-hook-form for fields that depend on other field values (e.g. `BankDetailsForm`)

### i18n

- `next-i18next` with `useTranslation`; translation keys in dot notation, e.g. `t("section.key")`
- Norwegian is primary, English secondary

### Error Handling

- Meetup and Confluence: fail gracefully (e.g. no events if scraping fails; site still works)
- Use try/catch for async work and log appropriately

### Tailwind and styles

- Use Tailwind for layout and components; Shadcn UI for shared form/UI primitives
- Global base and typography live in `src/styles/globals.css` (Tailwind layers + custom CSS)

## Project Structure

```
src/
├── components/
│   ├── ui/                 # Shadcn UI primitives (button, form, dialog, etc.)
│   ├── BankDetailsForm.tsx
│   ├── Region.tsx
│   ├── Footer.tsx
│   ├── Menu.tsx
│   ├── Socials.tsx
│   ├── ContentProse.tsx
│   ├── RegionsMap.tsx
│   └── ...
├── pages/
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── index.tsx
│   ├── utlegg.tsx           # Expense form
│   ├── [region].tsx         # Dynamic region pages
│   ├── policy.tsx
│   ├── principles.tsx
│   ├── gir-tilbake.tsx
│   ├── publish-kode24.tsx
│   └── 404.tsx
├── lib/
│   ├── expense.ts           # Zod schemas, createExpenseSchemas
│   ├── pdf.ts
│   ├── meetup-scraper.ts
│   ├── confluence.ts
│   └── utils.ts             # cn() etc.
├── data/
│   ├── regions.ts
│   ├── boardmembers.ts
│   ├── currencies.ts
│   ├── NorwegianBanks.ts
│   └── ...
├── hooks/
│   ├── use-toast.ts
│   ├── use-controllable-state.ts
│   └── ...
├── styles/
│   └── globals.css
└── env.mjs                  # Type-safe env via @t3-oss/env-nextjs
```

## External Integrations

- **Meetup.com**: Scraping with `cheerio` (public API deprecated). Fail gracefully; events cached via ISR (1 hour).
- **Confluence**: Fetched in `src/lib/confluence.ts` for content (e.g. policy/principles).

## Environment Variables

Defined and validated in `src/env.mjs` with `@t3-oss/env-nextjs`. Optional Confluence vars: `CONFLUENCE_CLOUD_ID`, `CONFLUENCE_EMAIL`, `CONFLUENCE_API_TOKEN`. Configure as needed for production.

## Notes

- React Strict Mode is on (`next.config.mjs`)
- ESLint + Prettier are configured
- Node.js >= 25 (see `package.json` engines)
- Next.js `images.remotePatterns` includes `secure.meetupstatic.com` for Meetup images
