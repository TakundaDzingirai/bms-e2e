# bms-e2e

External, **typed** end-to-end API tests for [BSMS](https://github.com/Taku-10/bsms).

Tests call the BSMS API through a client generated from the app's OpenAPI spec, so
requests and responses are type-checked at compile time. The spec is generated
**in the bsms repo from Zod schemas** (the source of truth) and vendored here.

```
bsms (Zod contracts) → openapi.json → [sync] → openapi-typescript → typed openapi-fetch client → Playwright specs
```

## Prerequisites

A running **bsms app pointed at LOCAL Supabase** (never production). From the bsms repo:

```bash
export PATH="$PWD/bin:$PATH"
npm run db:start          # local Supabase (Docker)
npm run build && \
  NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH \
  SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz \
  npm run start           # app on http://127.0.0.1:3000 against local Supabase
```

(Equivalently, `npm run test:e2e:local` in bsms builds with the same env.)

## Setup & run

```bash
cp .env.example .env       # local defaults work as-is
npm install
npm run setup              # sync spec from ../bsms + generate types
npm test                   # run the typed specs against the running app
```

- `npm run sync:spec` — vendors `../bsms/openapi/openapi.json` into `openapi/` (override path with `BSMS_SPEC_PATH`). Reports when the contract changed (drift guard).
- `npm run gen:types` — regenerates `src/api-types.ts` from the vendored spec (also runs automatically before `npm test`).

## CI

`.github/workflows/e2e.yml` runs the full suite automatically (push, PR, manual
`workflow_dispatch`, and a daily schedule). Each run checks out `bsms`, starts a
local Supabase stack (seeded), builds + starts the app against it, runs the typed
specs, and uploads the **Playwright HTML report** as a downloadable artifact —
so results and history live in this repo's **Actions** tab.

> Cross-account checkout: `bsms` lives on a different GitHub account. If it is
> private, add a repo-scoped PAT as the `BSMS_CHECKOUT_TOKEN` secret; a public
> `bsms` needs no secret.

## Safety

`src/env.ts` **refuses** to run if `APP_BASE_URL` or `SUPABASE_URL` is non-local,
unless `E2E_ALLOW_REMOTE=1`. Keep production out of the test loop.

## Layout

| Path | Purpose |
| --- | --- |
| `openapi/openapi.json` | vendored spec (drift-guard baseline) |
| `src/api-types.ts` | generated types (tracked so the repo type-checks on clone) |
| `src/client.ts` | typed `openapi-fetch` client + bearer-token auth middleware |
| `src/auth.ts` | seeded-staff sign-in → Supabase access token |
| `src/env.ts` | env loading + local-only guard |
| `tests/*.spec.ts` | typed API specs |
