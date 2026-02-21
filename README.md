# java.no

## Tech stack

- **Framework:** Next.js (Pages Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + Shadcn UI
- **i18n:** next-i18next (Norwegian / English)
- **Package manager:** pnpm

**Requirements:** Node.js ≥ 25.

## Getting started

### With Mise

```bash
mise install   # install Node (and use project tools)
mise run install
mise run dev   # or: mise dev
```

Open [http://localhost:3000](http://localhost:3000).

**Tasks:** `mise run install` | `mise run dev` | `mise run build` | `mise run start`

### Without Mise

Install Node and pnpm

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Meetup.com and events

Meetup’s public API is deprecated; events are fetched via scraping. If it fails, events are hidden, but everything will keep working. Event pages use Next.js [ISR](https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration) with 1-hour revalidation.

## Contributing

See [AGENTS.md](./AGENTS.md) for code style, structure, and conventions.
