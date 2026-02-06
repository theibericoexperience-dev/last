# Copilot instructions (IBERO)

## Big picture
- App is **Next.js 15 (App Router)**. UI lives in `app/**` and shared components in `components/**`.
- Server endpoints use **Route Handlers** under `app/api/**/route.ts` (e.g. profile: `app/api/user/profile/route.ts`).
- Data layer is **Supabase/Postgres**:
  - Client: `lib/db/supabaseClient.ts` (browser/session)
  - Server: `lib/db/supabaseServer.ts` (service/server context)
  - Prefer small domain helpers in `lib/domain/**` when available (see `lib/domain/README.md`).

## Dashboard / panel patterns
- The dashboard is in `app/panel/page.tsx` and renders sections via `app/panel/components/*Section.tsx`.
- Keep panel sections **client components** when they use hooks/fetch (`"use client"`). Example: `app/panel/components/ProfileSection.tsx`.
- When changing panel UI, prefer **minimal surface area**: update the section component and avoid refactors across unrelated routes.

## Migrations & DB safety
- SQL migrations live in `migrations/*.sql` and are intended to be **idempotent**.
- Repo convention: **do not auto-run DDL against production** without explicit approval (see `migrations/README.md`).
- There are additional security scripts under `db/policies/*.sql` and `db/audit/*`.

## Developer workflows (commands)
- Dev server: `npm run dev`
- Production build: `npm run build` (VS Code task: `next-build-check` runs `npm run build -- --no-lint`)
- Unit tests: `npm test` (Jest)
- Pricing-only test: `npm run test:pricing` (uses `ts-node/esm`)
- DB migration helpers:
  - Dry run: `npm run db:migrate:dry`
  - Apply: `npm run db:migrate`

## External integrations
- Stripe checkout/webhooks under `app/api/payments/**`.
- Playwright/Stripe E2E helpers live in `e2e/` and `scripts/e2e_playwright.js` (see `e2e/README.md`).

## Local conventions to follow
- TS config uses `@/*` path alias (see `tsconfig.json`). Prefer `@/lib/...` imports over deep relative paths.
- If you add an API route, keep request/response JSON shapes stable; reuse existing endpoints instead of creating duplicates.
- Avoid broad formatting churn: keep existing Tailwind class style and component structure.
