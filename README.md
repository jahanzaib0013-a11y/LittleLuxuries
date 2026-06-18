# Little Luxuries

> A full-stack e-commerce storefront built on **TanStack Start** (React) with a **Supabase** data layer, shadcn/ui on Radix, and edge deploys to Cloudflare/Vercel.

![Framework](https://img.shields.io/badge/tanstack_start-react-black)
![UI](https://img.shields.io/badge/ui-shadcn%2Fradix-7c3aed)
![DB](https://img.shields.io/badge/supabase-postgres-3ecf8e)

## Overview

Little Luxuries is a modern storefront for a lifestyle/goods brand. It pairs a type-safe router and server functions with a Supabase/Postgres backend, Redis-backed caching, and a component system built on Radix primitives and Tailwind v4.

**Features**

- **Catalog & product pages** — listing, detail, and search powered by TanStack Router + Query.
- **Cart & checkout** — validated forms (react-hook-form + Zod) with a server-side checkout flow.
- **Accounts & orders** — auth context, order history and customer data.
- **Invoices** — PDF invoices generated client-side with jsPDF.
- **Data & caching** — Supabase schema and RLS, Redis response caching (`CACHING_SETUP.md`).
- **Quality** — Playwright E2E suite (`tests/`) and component tests.
- **Deploy** — Cloudflare Workers (`wrangler.jsonc`) and Vercel (`vercel.json`) targets.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | TanStack Start / Router / Query, React |
| Styling | Tailwind CSS v4, shadcn/ui, Radix primitives |
| Forms | react-hook-form + Zod |
| Data | Supabase (Postgres), @supabase/supabase-js |
| Caching | Redis |
| Documents | jsPDF (+ autotable) |
| Motion | Framer Motion, Lenis, Embla carousel |
| Testing | Playwright, Vitest |
| Deploy | Cloudflare Workers, Vercel |

## Getting started

```bash
cp .env.example .env       # Supabase URL/anon key + server secrets
npm install
npm run dev                # local dev server
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the build |
| `npm test` | Run the test suite |
| `npm run lint` / `format` | Lint / Prettier |

## Setup guides

- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) — provision the database and schema.
- [CACHING_SETUP.md](CACHING_SETUP.md) — configure Redis response caching.

## License

© [Jahanzaib Iftikhar](https://github.com/jahanzaib0013-a11y)
