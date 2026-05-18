# Layer survey: shared/

## Inventory by subdirectory

### lib/

| File | Purpose | Used by |
| --- | --- | --- |
| `db.ts` | Prisma singleton (globalThis cache + pg Pool) | All entity queries, auth.server, feature workers |
| `errors.ts` | `AppError` base + 5 subclasses | Entities (throws), routes (errorComponent) |
| `logger.ts` | Pino singleton + redaction + child factory | IGDB clients + ad-hoc |
| `constants.ts` | App constants (RECENT_GAMES_LIMIT, USERNAME_MIN/MAX_LENGTH, debounce timings) | Mixed: app-wide + profile-specific |
| `utils.ts` | `cn()` (clsx + twMerge) | All shared/ui components, features, widgets |
| `igdb-image.ts` | IGDB cover URL builder + size table | `widgets/game-card`, `widgets/game-detail` |
| `auth/auth.server.ts` | Better Auth instance + Cognito + credentials providers | `routes/api/auth/$`, `entities/session/api` |
| `index.ts` | Barrel (currently only logger + createLogger) | `@/shared/lib` |

### ui/

| File | Purpose | Notes |
| --- | --- | --- |
| `button.tsx`, `input.tsx`, `label.tsx`, `form.tsx`, `card.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `popover.tsx`, `select.tsx`, `sheet.tsx`, `tooltip.tsx`, `command.tsx`, `badge.tsx`, `avatar.tsx`, `switch.tsx` | shadcn primitives | Standard, minimal modifications |
| `rating-input.tsx` | Custom 5-star half-step rating | **Domain-specific** — used only by `features/manage-library-entry` |
| `sonner.tsx` | Theme-integrated toast provider | **Provider wrapper** — belongs in `app/`, not `shared/ui/` |
| `index.ts` | Empty barrel | **Drift** — should re-export |

### api/

| File | Purpose |
| --- | --- |
| `s3.ts` | S3 client singleton + avatar constants (bucket, prefix, MIME allow-list, 10MB cap) — foot-gun #5 fix wired |
| `auth-client.ts` | Better Auth client for `useSession` / `signIn` / `signOut` |
| `igdb/token.ts` | Twitch OAuth token cache (single-flight dedup, 60s safety margin) |
| `igdb/fetch.ts` | IGDB REST POST wrapper |
| `igdb/search.ts`, `get-game-by-id.ts`, `get-game-by-slug.ts` | Public IGDB query functions |
| `igdb/query-builder.ts`, `queries.ts`, `constants.ts`, `schemas.ts` | Internal IGDB DSL + schemas |
| `igdb/index.ts`, `api/index.ts` | Barrels |

### config/

| File | Purpose |
| --- | --- |
| `index.ts` | **Empty** — env wiring is at root `env.ts` |

## Dominant patterns (from code)

- **Singleton via `globalThis` Proxy.** Prisma (`db.ts`), S3 (`s3.ts`), IGDB token (module-level cache). Consistent shape: lazy-create on first access, Proxy to survive HMR.
- **`.server.ts` correctly applied.** `auth.server.ts` is server-only and explicitly suffixed.
- **No upward imports.** Zero imports from `app/`, `routes/`, `widgets/`, `features/`, or `entities/`. FSD floor.
- **AppError taxonomy.** 5 subclasses (NOT_FOUND, CONFLICT, VALIDATION, UNAUTHORIZED, UPSTREAM) match the documented set.
- **Module-level env reads.** `logger.ts` and `igdb/token.ts` read `env.*` at top level — acceptable because both are infra setup, and the relevant env vars are in the `shared:` block (foot-gun #9 compliance).
- **UI is mostly primitives.** All shadcn except `RatingInput` (custom domain) and `Sonner` (provider wrapper).
- **IGDB error wrapping.** `igdb/fetch.ts` throws plain `Error`; `igdb/search.ts` (and other public functions) wrap into `UpstreamError`. Entity queries call IGDB and let `UpstreamError` bubble.
- **`shared/config/` is empty.** Env is centralized at root `env.ts`.

## Drifts

1. **`shared/lib/db.ts` should be `db.server.ts` — MEDIUM.** Genuinely server-only (Prisma + pg Pool), only imported by `.server.ts` files. Renaming makes the bundler boundary explicit and matches the `.server.ts` discipline elsewhere. Same applies to `s3.ts` (S3 server credentials) and arguably `auth/auth.server.ts` is already correct. Refactor: rename + 13 import updates.

2. **`shared/ui/index.ts` is empty — LOW.** Convention says parent `ui/index.ts` re-exports each component. Either populate it or document that direct submodule imports are preferred.

3. **`shared/config/index.ts` is empty and the directory unused — LOW.** Either remove the directory or document its placeholder status.

4. **`shared/ui/rating-input.tsx` is a domain component, not a primitive — LOW.** Reusable across rating surfaces, but technically violates the "primitives only" rule. Either document as an explicit exception or move to `entities/library-item/ui/` (since it's library-rating-specific).

5. **`shared/ui/sonner.tsx` is a provider wrapper, not a primitive — LOW-MEDIUM.** Provider setup belongs in `app/providers/` and gets wired in `__root.tsx`. Current placement works for single-import convenience but breaks the "primitives only" rule.

6. **`shared/api/igdb/constants.ts` exports no constants — LOW.** `IGDB_BASE_URL` is defined inside `igdb/fetch.ts`, not in constants. Either move + import or delete the file.

7. **`shared/lib/index.ts` partial barrel — LOW.** Re-exports `logger` and `createLogger` only — not `errors`, `db`, `igdb-image`, etc. Mixed state is confusing.

8. **`shared/lib/constants.ts` mixed concerns — LOW.** `RECENT_GAMES_LIMIT` (app-wide) ✓; `USERNAME_MIN_LENGTH`/`USERNAME_MAX_LENGTH` belong in `entities/profile/model/constants.ts`. Move on next refactor.

9. **No tests for `db.ts`, `logger.ts`, `auth.server.ts`, `s3.ts` — MEDIUM.** These are singletons + infra; typically mocked. Either unit-test the singleton-cache lifecycle or document that integration tests cover them.

## Proposed rules

### lib/

- Rule: server-only modules use `.server.ts` suffix (db, S3, auth instance, anything reading server-only env). Why: bundler boundary + scan-ability.
- Rule: singletons use the `globalThis` Proxy pattern verbatim — no per-module variations. Why: HMR survival + uniform shape.
- Rule: `AppError` has exactly 5 subclasses: `NotFoundError`, `ConflictError`, `ValidationError`, `UnauthorizedError`, `UpstreamError`. New subclasses require spec review. Why: bounded error surface.
- Rule: module-level env reads only in `env.ts` and dedicated infra setup files (logger, auth, IGDB token). Anywhere else, push the read inside a function. Why: foot-gun #9.
- Rule: utilities are reusable across 2+ layers. If only one feature uses it, it goes into that feature's `.utility.ts`. Why: avoids "everything in shared".
- Rule: constants live in `shared/lib/constants.ts` UNLESS domain-specific (then in `entities/<noun>/model/constants.ts`). Why: domain bleed prevention.
- Rule: there is one logger; child loggers via `createLogger({ service: "X" })`. Why: tagged logs + single config.

### ui/

- Rule: `shared/ui/` is primitives only — shadcn-derived components with minimal styling. Custom domain components live in `entities/` or `features/`. Why: layer responsibility.
- Rule: documented exceptions (currently: `RatingInput`, `Sonner`) carry a comment block linking to this rule. Why: future readers know what's NOT the rule.
- Rule: `shared/ui/index.ts` is the public barrel — re-exports every primitive. Why: single import path.
- Rule: UI primitives import only from `@/shared/lib/utils` + radix-ui + react. No imports from other layers. Why: platform-neutral.
- Rule: styling via `cn()` + Tailwind only. No inline `style={...}` (except for dynamic values like `style={{ '--progress': x }}`), no CSS-in-JS. Why: one styling pipeline.

### api/

- Rule: API modules are single-responsibility (S3, auth-client, IGDB DSL). No business logic. Why: layer purity.
- Rule: low-level clients throw plain `Error`; public wrappers re-throw as `AppError` subclasses (typically `UpstreamError`). Why: clean separation between transport and domain.
- Rule: IGDB token cache is internal to `igdb/`. External callers use `searchGames()`, `getGameByIgdbId()`, etc. — never `getIgdbToken()` directly. Why: encapsulation.

### config/

- Rule: `shared/config/` is reserved for per-layer env subsets if needed. Currently unused. Delete or document. Why: nothing rots faster than empty directories.

## README accuracy

`src/shared/README.md` is ~85% accurate. Missing:

- the `globalThis` Proxy singleton pattern,
- the `.server.ts` discipline for genuinely server-only modules,
- the `AppError` subclass catalog,
- the `RatingInput` / `Sonner` exceptions to "primitives only",
- the empty-`config/` situation.

Recommend a 10-15 LOC extension covering the above with pointers to FOOT-GUNS.md.
