---
description: Rules for the FSD `shared/` layer in savepoint-tanstack (db, logger, errors, IGDB, S3, primitives)
paths:
  - "savepoint-tanstack/src/shared/**/*"
---
# Rules — `shared/` layer

The BOTTOM of the FSD graph. `shared/` imports from nothing in the app
graph; everything imports it. Holds DB / logger / errors / auth-client /
IGDB / S3 / shadcn primitives.

## Rules

### `shared/lib/`

- **Rule:** server-only modules use the `.server.ts` suffix (DB client, auth instance, S3 client, anything that reads server-only env). **Why:** bundler boundary clarity + scan-ability.
- **Rule:** singletons use the `globalThis` Proxy pattern — no per-module variations. **Why:** HMR survival + uniform shape.
- **Rule:** `AppError` has exactly 5 subclasses: `NotFoundError`, `ConflictError`, `ValidationError`, `UnauthorizedError`, `UpstreamError`. New subclasses require spec review. **Why:** bounded error surface. See [`errors.md`](./errors.md).
- **Rule:** module-level env reads only in `env.ts` and dedicated infra setup files (logger, auth, IGDB token). Anywhere else, push the read inside a function. **Why:** foot-gun #9.
- **Rule:** utilities live in `shared/lib/` only if reusable across 2+ layers. Single-feature helpers go in that feature's `lib/` or `.utility.ts`. **Why:** avoids "everything in shared".
- **Rule:** constants live in `shared/lib/constants.ts` UNLESS domain-specific (then in `entities/<noun>/model/constants.ts`). **Why:** domain bleed prevention.
- **Rule:** there is one logger; child loggers via `createLogger({ service: "X" })`. **Why:** tagged logs + single config.

### `shared/ui/`

- **Rule:** `shared/ui/` is primitives only — shadcn-derived components with minimal styling. **Why:** layer responsibility; custom domain components belong in entities or features.
- **Rule:** `shared/ui/index.ts` is the public barrel — re-exports every primitive. **Why:** single import path (`import { Button } from "@/shared/ui"`).
- **Rule:** UI primitives import only from `@/shared/lib/utils` + radix-ui + react. No imports from other layers. **Why:** primitives must stay platform-neutral.
- **Rule:** styling via `cn()` + Tailwind only. No inline `style={...}` (except for dynamic CSS variables), no CSS-in-JS. **Why:** one styling pipeline.

### `shared/api/`

- **Rule:** API modules are single-responsibility (S3, auth-client, IGDB DSL). No business logic. **Why:** layer purity.
- **Rule:** low-level clients throw plain `Error`; public wrappers re-throw as `AppError` subclasses (typically `UpstreamError`). **Why:** clean separation between transport and domain.
- **Rule:** IGDB token cache is internal to `shared/api/igdb/`. External callers use `searchGames()`, `getGameByIgdbId()`, etc. — never `getIgdbToken()` directly. **Why:** encapsulation.
- **Rule:** S3 client exports avatar constants only (`AVATAR_BUCKET`, `AVATAR_PATH_PREFIX`, `AVATAR_MIME_ALLOW_LIST`, `AVATAR_MAX_BYTES`). **Why:** single source of truth for upload policy.

### `shared/config/`

- **Rule:** `shared/config/` is reserved for per-layer env subsets if needed. Currently unused; either populate or delete. **Why:** nothing rots faster than empty directories.

## Documented exceptions

### Non-primitive UI in `shared/ui/`

Two components live in `shared/ui/` despite not being shadcn primitives:

- `rating-input.tsx` — custom 5-star half-step rating component. Used by `features/manage-library-entry`. Acceptable because reusable; document with a comment block when adding new exceptions.
- `sonner.tsx` — theme-integrated toast provider wrapper. Should move to `app/providers/` (provider, not primitive). Tracked as 2026-05-18 audit follow-up.

## See also

- [`errors.md`](./errors.md) — `AppError` catalog
- [`../../../savepoint-tanstack/FOOT-GUNS.md`](../../../savepoint-tanstack/FOOT-GUNS.md) — foot-guns #4 (globalThis HMR), #5 (AWS SDK checksum), #9 (env-boundary)
