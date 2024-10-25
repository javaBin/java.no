## Getting Started

You need to:

- Install the javascript libraries:

```bash
pnpm install
```

- Run Next.js dev server:

```bash
pnpm dev
```

## Meetup.com API

Since the meetup.com API was deprecated we've implemented web scraping instead, it might be brittle, if it fails, it
will simply not show any events.

Events are regenerated through Next.js [Incremental Static Regeneration
](https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration) with a revalidate timer set to 1
hour.

This will recreate the page server-side at most once per hour

## Styling

The site currently uses Bootstrap, since that is what the old site used, but we wish to switch to styling done in
Tailwindcss.

**HELP WANTED WITH DESIGN AND STYLING**
