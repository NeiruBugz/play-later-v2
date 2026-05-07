# savepoint-tanstack

> **Under construction.** This app is being built per spec 021 to replace `savepoint-app/`. Until cutover (Slice 20), `savepoint-app/` is the canonical, deployed app. Do NOT modify `savepoint-app/` from work in this directory unless explicitly aligned via the spec.

## Spec

Spec 021 lives at [`../context/spec/021-migrate-to-tanstack-start/`](../context/spec/021-migrate-to-tanstack-start/):

- [`functional-spec.md`](../context/spec/021-migrate-to-tanstack-start/functional-spec.md) — what behavior must match `savepoint-app/`.
- [`technical-considerations.md`](../context/spec/021-migrate-to-tanstack-start/technical-considerations.md) — stack, DAL pattern (C2), auth wiring, env, testing.
- [`tasks.md`](../context/spec/021-migrate-to-tanstack-start/tasks.md) — slice-by-slice TDD task list. Methodology header is binding.

## Purpose

Side-by-side TanStack Start v1 rewrite of the Next.js app at `savepoint-app/`. Same Postgres database, same Better Auth tables, same S3 bucket, same IGDB client. Both apps run locally during the migration; cutover is a single Vercel root-directory change at Slice 20.

## TDD policy

Binding rule from the spec methodology header:

- Every slice lists test sub-tasks **before** implementation sub-tasks.
- Tests are authored failing first (RED), then made to pass (GREEN), then refactored.
- PR descriptions reference the failing-test commit.
- Canary harness sentinel tests live in [`test/canary/`](./test/canary/) and [`test/integration/canary.integration.test.ts`](./test/integration/canary.integration.test.ts) — do not delete them. They prove the unit + integration harnesses are wired.
- The boundary-rule regression guard at [`test/eslint/`](./test/eslint/) is also load-bearing — do not delete.
- During a **RED** sub-task it is fine — and expected — for `typecheck`, `test:unit`, and `test:integration` to fail. Use plain static imports of the not-yet-created module so the failure is clear and TS-honest. Do **not** reach for `import("./x" as string)` / `/* @vite-ignore */` tricks to keep typecheck green; that hides the signal. CI gates at the slice boundary, not at every intermediate commit.

## Component test conventions

Every component / route test in `src/**/*.test.tsx` follows the same shape. See [`src/features/auth-cognito-sign-in/ui/cognito-sign-in-button.test.tsx`](./src/features/auth-cognito-sign-in/ui/cognito-sign-in-button.test.tsx) and [`src/features/auth-email-sign-in/ui/email-sign-in-form.test.tsx`](./src/features/auth-email-sign-in/ui/email-sign-in-form.test.tsx) as the reference shape.

1. **Element vocabulary** — module-level `const elements = { ... }` map of domain-named query helpers wrapping `screen.getByX` / `screen.queryByX`. Names express intent (`getSocialProviderButton`, `getEmailInput`), not RTL mechanics. Centralizes "how do we find X" so a label/role change is a one-place edit.
2. **Action vocabulary** — module-level `const actions = { ... }` map of domain-named user interactions, each composing one or more `elements` calls plus a `userEvent` interaction. Names are domain verbs (`submitForm`, `clickSocialProviderButton`), not mechanical motion. Built on top of `elements` — composition is the point.
3. **Given / When / Then describe nesting** — outer `describe(ComponentName)` for the subject; inner `describe("given …")` for a scenario; `it("...")` is a single Then. The inner describe groups `it`s that share the same arranged state.
4. **Arrange in `beforeEach`, assertion-only `it`s** — `render(...)` and the triggering interaction migrate UP from inside `it` into the sibling `beforeEach`. Each `it` body is **only** the assertion. Multiple `it`s under one `describe` re-run the arrange+act with clean state.
5. **Implicit-setup `userEvent`** — `await userEvent.click(...)` directly. Skip `const user = userEvent.setup()` unless you actually need to configure delay / clipboard / skipHover.
6. **Strings over regex** — `screen.getByRole("button", { name: "Sign in" })`, never `{ name: /sign in/i }`. Strict equality, no regex parsing tax, no case-insensitivity to mask label drift.

A shared page-object-ish helper file is not used yet — `elements` / `actions` are inline per test. Lift to shared helpers only when a real reuse case appears.

## Component file conventions

Every UI component in `src/{app,routes,widgets,features,entities}/**/ui/` lives in its **own folder** with a barrel. The reference shape is [`src/app/error-boundary/`](./src/app/error-boundary/).

Folder layout, where `<name>` is the kebab-case component name:

```
<name>/
├── index.ts              # barrel — public surface
├── <name>.tsx            # component (named export, no default)
├── <name>.type.ts        # prop + view-model types
├── <name>.utility.ts     # pure helpers used only by this component (optional)
└── <name>.test.tsx       # co-located test (optional)
```

**Rules**

1. **One component per folder.** Folder name = component name in kebab-case = file basename. The component itself is a named export matching the PascalCase folder name (`error-boundary/` → `ErrorBoundary`).
2. **`index.ts` is the public surface.** It re-exports the component value and any prop/view-model type that callers outside the folder need:
   ```ts
   export { ErrorBoundary } from "./error-boundary";
   export type { ErrorBoundaryProps } from "./error-boundary.type";
   ```
   Callers import from the folder (`from "./error-boundary"` or `from "@/app/error-boundary"`), never from a sibling `.type` / `.utility` module directly.
3. **Inside the folder, relative `./<name>.type` / `./<name>.utility` is allowed.** That's the whole point — internal cohesion, external opacity. See [`src/app/error-boundary/error-boundary.tsx`](./src/app/error-boundary/error-boundary.tsx).
4. **`.type.ts` holds props plus any view-model types** the component needs to express its shape. Domain types still live in `entities/<noun>/model/`. The `.type.ts` file imports from `model/` when it needs a domain noun — it does not redefine domain types.
5. **`.utility.ts` is for pure, component-local helpers.** Anything reused across components belongs in `shared/lib/` or, if domain-shaped, on the entity. If a `.utility.ts` is reused by a sibling component, lift it.
6. **Parent `ui/index.ts` re-exports each component folder.** Pattern: `export { Foo } from "./foo"; export type { FooProps } from "./foo";` — the extensionless path resolves to the folder's barrel.
7. **No default exports.** Same rule as the rest of the app.

**Migrating from a flat shape:** if you encounter `<name>.tsx` + `<name>.type.ts` as siblings inside `ui/`, move them into a `<name>/` folder and add the barrel. Tests come along unchanged — the relative `./<name>` import resolves to the sibling `.tsx` file inside the new folder.

## FSD layer map

Top → bottom. Lower may not import upper.

| Layer      | Path                               | Holds                                                                                                                     |
| ---------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `app`      | [`src/app/`](./src/app/)           | Providers, root wiring, global styles, root error boundary                                                                |
| `routes`   | [`src/routes/`](./src/routes/)     | TanStack file-based routes — thin loaders + route components                                                              |
| `widgets`  | [`src/widgets/`](./src/widgets/)   | Composite UI blocks (header, profile overview, library grid)                                                              |
| `features` | [`src/features/`](./src/features/) | User-intent slices. Each has `model/`, `api/` (server fns), `ui/`                                                         |
| `entities` | [`src/entities/`](./src/entities/) | Domain nouns. Each has `model/` (zod + types), `api/` (plain async query fns throwing `AppError`), `ui/` (display-only)   |
| `shared`   | [`src/shared/`](./src/shared/)     | `lib/` (db, logger, errors, auth-client), `ui/` (shadcn primitives), `config/` (env), `api/` (S3, IGDB low-level clients) |

Per-layer guidance is in `src/<layer>/README.md`.

### Import rules

- **Direction:** `app` > `routes` > `widgets` > `features` > `entities` > `shared`. Lower never imports upper.
- **Server fns vs queries:** server fns live in `features/*/api/`; queries in `entities/*/api/`. Feature server fns compose entity queries. Entity queries never import features.
- **No sibling-to-sibling imports** inside `features/` or `entities/`. Cross-feature reuse goes through `shared/` or an `entity`.
- **Routes are thin:** loaders call entity queries directly (server-side); route components render widgets. No business logic in routes.
- Enforced by `eslint-plugin-boundaries` in [`eslint.config.mjs`](./eslint.config.mjs). Regression-guarded by [`test/eslint/`](./test/eslint/).

## DAL conventions (C2 pattern)

Two layers only — no service classes, no `Result` wrappers, no domain mappers. Vocabulary used below ("loader-direct read," "feature server fn," "UX-hint query," "privacy invariant," "handler helper") is defined in [CONTEXT.md](./CONTEXT.md). Read that first.

### File naming: `.server.ts` is a bundler boundary, not a runtime tag

The `.server` suffix is enforced by TanStack Start's `import-protection` Vite plugin: any file matching `**/*.server.*` is **forbidden** to be imported from a client module. The bundler refuses to ship it.

- Use `*.server.ts` ONLY for genuinely server-only modules: DB clients, the Better Auth instance, `getServerUserId`, entity queries (read directly from Prisma; throw `AppError`s).
- **Do NOT use `*.server.ts` for `createServerFn`-wrapped modules.** These files ARE meant to be client-importable — the plugin replaces the handler body with an RPC stub on the client build. Tagging them `.server.ts` defeats the construct and crashes the dev server with `[import-protection] Import denied in client environment`.

Mental shortcut: "anything that runs on the server gets `.server.ts`" is wrong. `createServerFn` runs on the server but is **called from the client** through the bridge — its file must be client-importable.

1. **`entities/<noun>/api/*.server.ts`** — plain async server-only queries. Direct Prisma calls via the [`prisma`](./src/shared/lib/db.ts) singleton. Throw [`AppError`](./src/shared/lib/errors.ts) subclasses (`NotFoundError`, `ConflictError`, `ValidationError`, `UnauthorizedError`, `UpstreamError`) on failure. No DI, no classes. **Reference:** [`src/entities/profile/api/get-profile.server.ts`](./src/entities/profile/api/get-profile.server.ts).
2. **`features/<intent>/api/<name>.ts`** (NO `.server` suffix) — `createServerFn` wrappers from `@tanstack/react-start`: `.inputValidator(...).handler(async ({ data }) => …)`. Delegate to entity queries. Resolve `userId` via `requireUserId()` (handler helper) — never trust it from input, never call `getServerUserId` directly. **Reference:** [`src/features/auth-email-sign-in/api/get-email-sign-in-enabled.ts`](./src/features/auth-email-sign-in/api/get-email-sign-in-enabled.ts).

Errors bubble up to the route `errorComponent` or the root error boundary at [`src/app/error-boundary/`](./src/app/error-boundary/) (mounted in `__root.tsx`), which branches on `AppError.code` for user-facing copy.

### Binding rules

- **Strict feature-server-fn rule.** A `features/<name>/api/` server fn exists **iff at least one consumer is not a route loader**. Non-loader consumers: client components (`useServerFn`), other server fns, route `beforeLoad` guards. If only a route loader needs it, write a [loader-direct read](./CONTEXT.md#loader-direct-read) — no escape hatch for "the composition is large." **Bundler caveat (TanStack Start v1):** the canonical loader-direct shape (top-level `import { x } from "./x.server"` in a route file) hangs the app on hover-preload because Vite's `import-protection` denies those imports in the client bundle and TanStack's route extractor doesn't strip them. Until the extractor learns this, route loaders that need server-only modules must wrap the work in a `createServerFn` exported from a non-`.server.ts` file (mirroring `getProfileSettingsFn`); these loader-only server fns are tolerated despite the strict rule. Full discussion in [CONTEXT.md → Loader-direct read → Known bundler caveat](./CONTEXT.md#loader-direct-read).
- **Authed handlers use `requireUserId()`.** The handler helper resolves the request internally and throws `UnauthorizedError` on miss. The route-guard `requireUserIdOrRedirectFn` is for `beforeLoad` (it redirects). The low-level `getServerUserId(request)` is for tests and conditional-read paths only.
- **Validate twice.** `.inputValidator` runs only on cross-network calls; programmatic callers (other server fns, tests, route loaders calling another server fn) bypass it. The handler must re-`parse` with the same schema. The redundancy is structural, not duplicative — it covers two distinct call paths. Handlers must not branch on whether they're under test or wrap `getRequest()` with a try/catch fallback.
- **Single source for database invariants.** Each unique/FK constraint is translated to `AppError` in **exactly one place**: the entity update query that maps the Prisma error code (inspect `error.meta?.target` to scope the mapping to the right column). Feature handlers do not pre-check.
- **UX-hint queries are not enforcement.** Queries like `getUsernameAvailability` exist only for live UI feedback. They are never called from a feature handler as a precondition check. See [UX-hint query](./CONTEXT.md#ux-hint-query).
- **Privacy invariants live on the entity.** A privacy gate (e.g., "public profile only") is encoded inside the entity query that throws `NotFoundError` for both "missing" and "denied," not in a feature handler or route guard. See [Privacy invariant](./CONTEXT.md#privacy-invariant).
- **No specialized subset queries.** If query `B`'s result is a field of aggregate `A`'s result, delete `B` and read from `A`. Change `A`'s shape if it's wrong.

**ID format:** Better Auth emits 32-char nanoid user IDs. Never use `z.string().cuid()`; use `z.string().min(1)`.

**FSD reaffirmation for the DAL:** entity queries import only from `@/shared/*`. Feature server fns import from `@/entities/*` and `@/shared/*`. Server fns never import other features; entity queries never import features. Enforced by `eslint-plugin-boundaries`.

### Pending compliance (refactor in flight)

Code that does not yet match the rules above — to be cleaned up in the next architectural commits. Listed so the rules read as the source of truth, not the code:

- `getCurrentUserIdFn` in `entities/session/api/get-current-user-id.ts` is the "redirect-if-authed" gate used by `/login` to bounce signed-in users to `/profile`. Its name reads as a low-level reader, not a guard — to be renamed (e.g., `redirectIfAuthedFn`) in a follow-up so the two redirect intents are symmetrically named with `requireUserIdOrRedirectFn`.

## Path aliases

From [`tsconfig.json`](./tsconfig.json):

- `@/*` → `src/*` (preferred)
- `#/*` → `src/*` (alternative — also wired in `package.json` `imports`; both resolve identically; may be consolidated later)
- `@env` → root [`env.ts`](./env.ts) (typed env from `@t3-oss/env-core`). **Never read `process.env.*` outside `env.ts`.**

## Where to look first

| If you want to...                           | Look here                                                                                                                                                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add a route                                 | [`src/routes/`](./src/routes/) (TanStack file-based; `$param` for dynamic segments, `_authed/` for guarded group)                                                                                                                           |
| Add a server fn (mutation, authed re-fetch) | `src/features/<name>/api/<fn-name>.ts` (NO `.server` suffix — see "File naming" above)                                                                                                                                                      |
| Add an entity query (read)                  | `src/entities/<name>/api/<query-name>.server.ts`                                                                                                                                                                                            |
| Add a composite UI block                    | `src/widgets/<name>/ui/...`                                                                                                                                                                                                                 |
| Add a shared primitive                      | [`src/shared/lib/`](./src/shared/lib/) or [`src/shared/ui/`](./src/shared/ui/)                                                                                                                                                              |
| Add an env var                              | Add to [`env.ts`](./env.ts) Zod schema first, then `import { env } from "@env"`                                                                                                                                                             |
| Schema change                               | **Don't migrate from this app.** [`prisma/schema.prisma`](./prisma/schema.prisma) is a mirror of `savepoint-app/prisma/schema.prisma`. Migrate in `savepoint-app/` first, then re-copy schema + migrations here. CI diff-checks divergence. |
| Run tests                                   | `pnpm --filter savepoint-tanstack test:unit` (jsdom, mocked Prisma) / `test:integration` (real PG, sequential)                                                                                                                              |
| Understand FSD layer rules                  | This file + per-layer `src/<layer>/README.md`                                                                                                                                                                                               |

## Quick commands

| Task                        | Command                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| Dev server                  | `pnpm --filter savepoint-tanstack dev` (port 6061 — see known gaps) |
| Typecheck                   | `pnpm --filter savepoint-tanstack typecheck`                        |
| Lint (incl. FSD boundaries) | `pnpm --filter savepoint-tanstack lint`                             |
| Format check                | `pnpm --filter savepoint-tanstack format:check`                     |
| Format (write)              | `pnpm --filter savepoint-tanstack format`                           |
| Unit tests                  | `pnpm --filter savepoint-tanstack test:unit`                        |
| Integration tests           | `pnpm --filter savepoint-tanstack test:integration`                 |
| Generate Prisma client      | `pnpm --filter savepoint-tanstack prisma:generate`                  |
| Format Prisma schema        | `pnpm --filter savepoint-tanstack prisma:format`                    |

## Foot-guns we've hit (read before adding server fns / browser-direct AWS calls)

These are silent-failure traps surfaced during slices 5B–6. Each fails at _runtime_ under specific conditions and is invisible to typecheck / lint / unit tests. Manual verification at slice boundaries is the only structural defence — but knowing the pattern saves a debugging cycle.

### Bundler-graph traps

1. **`.server.ts` filename is a bundler-enforced client boundary.** See [File naming](#file-naming-serverts-is-a-bundler-boundary-not-a-runtime-tag). `createServerFn`-wrapped feature modules MUST drop the suffix; only genuinely server-only modules (DB client, auth instance, entity queries, `getServerUserId`) get it.
2. **Loader-direct read of a `.server.ts` from a route module hangs the app on hover-preload.** The Vite plugin denies the import on the client build but TanStack's route extractor doesn't strip it from preload. See [CONTEXT.md → Loader-direct read → Known bundler caveat](./CONTEXT.md#loader-direct-read). Workaround: wrap the work in a `createServerFn` exported from a non-`.server.ts` file; the route imports the server fn value, which is client-safe.
3. **Custom shims around `createServerFn` leak server modules into the client bundle.** Specifically: any export that retains a _module-level reference_ to the handler function (e.g. `Object.assign(async opts => result ?? handler(opts), _serverFn)`) holds the handler graph open on the client side. The Start Vite plugin only strips the body of the literal `.handler(fn)` call; it does NOT chase secondary references. Symptom: `[Client] Warning: Error in route match: __root__/` wrapped in a `CatchBoundaryImpl`. Fix: never re-export the bare handler; if a test path needs to call the impl directly, split into `getX.server.ts` (plain async worker) + `getXFn.ts` (`createServerFn` thin wrapper) and import the worker from server-only test code.

### Runtime / dev-environment traps

4. **`globalThis` singleton caches survive Vite HMR.** Once `globalThis.s3Client` / `globalThis.prisma` is populated, editing the constructor (e.g. adding `requestChecksumCalculation`) won't take effect until you fully restart `pnpm dev`. The cache is intentional — it prevents connection-pool churn during HMR — but it makes config diffs invisible. Mitigation: when changing `s3.ts`, `db.ts`, or any other singleton constructor, restart the dev server explicitly; do not trust HMR.
5. **AWS SDK v3 ≥ 3.729 auto-adds CRC32 checksum headers, breaking browser-direct presigned PUTs.** The SDK changed `requestChecksumCalculation` default from `WHEN_REQUIRED` to `WHEN_SUPPORTED`, which means presigned `PutObjectCommand` URLs now sign `x-amz-checksum-crc32` + `x-amz-sdk-checksum-algorithm` headers the browser cannot send. Symptom: PUT to S3/LocalStack returns `400 InvalidRequest` despite signature looking valid. Fix: pass `requestChecksumCalculation: "WHEN_REQUIRED"` to the `S3Client` constructor (already wired in [`src/shared/api/s3.ts`](./src/shared/api/s3.ts)). Same fix will be needed in `savepoint-app/` next time its SDK bumps.
6. **Docker bind-mounts of missing files silently become empty directories on macOS.** `./.docker/localstack/init-s3.sh:/etc/localstack/init/ready.d/init-s3.sh:ro` silently created the host path as an empty directory when the script was missing — LocalStack started with no bucket, no CORS, no public-read policy. Mitigation: keep init scripts committed and executable; on a fresh `docker compose up`, verify the bucket actually exists (`docker exec savepoint-localstack awslocal s3 ls`).
7. **S3 / LocalStack browser-direct uploads need explicit CORS + public-read.** S3 has no origin allow-list by default and no public read by default. Avatar uploads succeed but the rendered `<img src={publicUrl}>` returns 403 unless: (a) bucket CORS allows `GET / PUT / HEAD` from the dev origin (`localhost:6060` AND `localhost:6061` for the parallel-run window), and (b) a bucket policy grants `s3:GetObject` on the avatar prefix. Both are encoded in [`./.docker/localstack/init-s3.sh`](.docker/localstack/init-s3.sh). For prod, the same shape needs to land in Terraform under `infra/`.

### Test-infrastructure trap

8. **`createServerFn` returns `undefined` when invoked programmatically in vitest.** The Start Vite plugin AST-rewrites `.handler(fn)` into `.handler(generatedExtractedFn, fn)`, and the framework's client base middleware reads from the generated extracted-fn shape; without the plugin loaded in the test harness, the framework drops the handler's return value. Symptom: integration tests assert on a server-fn return and get `undefined`. Two acceptable mitigations: (a) the worker/server-fn split from foot-gun #3, where the test imports the plain worker directly; (b) future: add the Start Vite plugin to [`vitest.config.ts`](./vitest.config.ts) so `createServerFn` works end-to-end in tests. Tests that assert only on side effects (DB writes, mock call counts) are unaffected.

## Logger (S7)

Pino chosen, copied **verbatim** from `savepoint-app/shared/lib/app/logger.ts` to [`src/shared/lib/logger.ts`](./src/shared/lib/logger.ts), with the only edit being `process.env.*` → typed `env` from `@env` (durable project rule). Versions pinned to match the canonical app exactly (`pino@10.1.0`, `pino-pretty@13.1.3`) so log shape, redaction paths, and error normalization stay byte-identical across the migration. Dev uses `pino-pretty` transport (colorized, single-line off); prod emits structured JSON. Ticks the spec's "default: copy verbatim" decision for S7.

## Known gaps / pending decisions

- [x] **Logger** ported (S7) — see Logger section above.
- **Real `db.ts`** (Prisma singleton) not yet wired — Slice 3 implements.
- **Auth** not yet wired — Slice 1 (Better Auth, no `nextCookies()` plugin).
- **Tailwind** scaffolded as v4 (CSS-first); `savepoint-app/` uses v3 (JS config). Tokens are translated, not copy-pasted verbatim.
- **No production deployment** until Slice 20 cutover. Verification is local-only until then.

## Known gaps (Vertical 1)

Scope: slices 0–6. Both apps now bind to `:6060` — verification is **swap-and-compare** (stop one app, start the other) against the same Postgres on `:6432`. Side-by-side parity is deferred to S20 cutover.

### Flow 1 — Cognito sign-in (`/login`)

- ✅ Authed users redirected away from `/login` (`beforeLoad` guard).
- ✅ OAuth via `authClient.signIn.social({ provider: "cognito" })`.
- ✅ Branded layout ported via [`widgets/auth-page/ui/auth-page-view`](./src/widgets/auth-page/ui/auth-page-view/auth-page-view.tsx) — centered `max-w-md` card, `text-display` "SavePoint" headline, tagline, divider w/ "or", `sr-only` `<h1>` for a11y. Slot-based composition (route owns feature wiring). Cognito button promoted to `variant="outline"` + full-width.
- ⚠️ `callbackURL` divergence: tanstack → `/profile`; canonical → `/dashboard` (route doesn't exist here yet).
- ⚠️ Button label cosmetic: canonical renders Google-logo SVG + "Sign in with Google"; tanstack renders plain "Sign in with Cognito" (no logo). Visual treatment matches; copy / icon do not.
- ⚠️ No `onError` handler on the Cognito sign-in button — silent SSO failure. Low severity.

### Flow 2 — Own profile read (`/profile`)

- ❌ **Intentional architectural pivot** (NOT a regression): canonical `/profile` is redirect-only (`/u/${username}` if set, `/profile/setup` otherwise); tanstack `/profile` renders the own-profile view inline via `<ProfileOverview/>`. Reviewers must not treat as parity break.
- ⚠️ No `/profile/setup` onboarding route in tanstack. Out of scope for V1.
- ✅ Auth guard via `_authed.tsx` → `requireUserIdOrRedirectFn`.
- ✅ `getProfilePageDataFn` parallel-loads `getLibraryStats` + `getProfileById`.
- ⚠️ Page `<title>` still shows starter placeholder; canonical sets `"Profile"`.

### Flow 3 — Settings edit (`/settings/profile`)

- ✅ Display name, username (with debounced availability check), visibility toggle all present.
- ✅ `toast.success` on save; inline `role="alert"` on rejection.
- ✅ Username uniqueness enforced at DB; `ConflictError` surfaced to toast (single-source per simplification plan).
- ⚠️ Layout differs: canonical embeds avatar in the form card; tanstack splits `<AvatarUpload/>` as a top-level section. Intentional.
- ⚠️ "Preview public profile →" link absent on tanstack settings.
- ✅ "Back to profile" link present.

### Flow 4 — Avatar upload via LocalStack (`/settings/profile`, `/profile`)

- ✅ Three-step flow: presigned URL → browser PUT → `setAvatarUrlFn`.
- ✅ `requestChecksumCalculation: "WHEN_REQUIRED"` wired (foot-gun #5).
- ✅ `router.invalidate()` after persist; image refreshes everywhere.
- ✅ MIME allow-list: jpeg/png/gif/webp.
- ✅ Two surfaces: settings section + own-profile `<ProfileHeader/>` overlay (slot pattern, gated by `isOwnProfile`).
- ⚠️ No client-side size pre-check (canonical also lacks one — parity).

### Flow 5 — Public profile (`/u/$username`)

- ❌ **Intentional V1 scope gap** (NOT a regression): canonical `/u/[username]` is a tabbed layout (Overview / Library / Activity), with social counts, follow button, private-profile message, and `generateMetadata`. Tanstack renders flat `<ProfileOverview/>` only. Tabs / social / SEO arrive in later verticals.
- ✅ Privacy gate at the entity layer (`getPublicProfile` → `NotFoundError` for private profiles).
- ⚠️ Unknown username surfaces the generic root error boundary; canonical hits a styled 404 page.
- ⚠️ No `<title>` / OG metadata.

### Flow 6 — Sign-out (sidebar user menu)

- ✅ `authClient.signOut()` triggered from sidebar; `router.invalidate()` re-runs root loader, sidebar disappears, lands on landing page.
- ⚠️ Sidebar uses bespoke `<ul role="menu">` popover; canonical uses shadcn `DropdownMenu` with extra "Profile settings" / "Account" entries (latter routes not yet ported).
- ⚠️ Standalone `LogoutButton` feature component is unused by the sidebar (kept for tests / potential reuse).
- ⚠️ No `onError` handler on `signOut()` — silent failure. Parity with canonical.

### Summary

| Flow                 | Status                                                | Blocking S7? |
| -------------------- | ----------------------------------------------------- | ------------ |
| 1 — Cognito sign-in  | ✅ layout ported (post-S7T1); ⚠️ copy/icon gaps only  | No           |
| 2 — Own profile read | ❌ intentional pivot, documented                      | No           |
| 3 — Settings edit    | ⚠️ minor layout / missing preview link                | No           |
| 4 — Avatar upload    | ✅ functional parity                                  | No           |
| 5 — Public profile   | ❌ V1 scope boundary, documented                      | No           |
| 6 — Sign-out         | ⚠️ menu items missing (account routes not yet ported) | No           |

No findings block Slice 7. Items marked ❌ are intentional architectural / scope pivots, not regressions.

## Intentional divergences (Slice 14 — phase-2 streaming)

> **Supersedes** the eager-prefetch wiring in [Slice 14 (initial)](#intentional-divergences-slice-14) for collections + related games. The worker contract (`getRelatedGames`), the `RelatedGamesInfiniteList` component, and the search-param schema on the route are all unchanged. Only the page-data composition and the route render shape moved.

The cache-hit asymmetry of the original Slice 14 — `collections` was transient on `GameDetails` and only populated on cache-miss, so cache-hit pages rendered no related games — was the trigger. The fix promotes both IGDB-derived live datasets (collections → related games, plus times-to-beat) out of the loader-blocking phase 1 into a streamed phase 2.

- **Phase 1 stays DB-only.** `getGameDetails` returns `{ game, libraryEntry, journalTeaser, relatedGames: [] }`. The `collections` field is gone — `entities/game/api/get-game-details.server.ts` no longer carries IGDB-derived live data, and `GAME_FIELDS` in `get-game-by-slug.ts` no longer requests `collections.*`. `SearchResponseItemSchema` dropped the `collections` array; `CollectionRefSchema` is still exported for the new entity query that consumes it.
- **Phase 2 is streamed via bare promises.** `features/game-detail/api/get-game-detail-page-data.ts` returns `{ data, viewerUserId, deferredRelatedGames, deferredTimesToBeat }`. The two `Deferred*` fields are bare `Promise<...>` values — TanStack Start's loader-result serializer handles deferred promises natively when they reach `<Await>` (which internally calls `defer()` on the pending promise). No explicit `defer()` wrapping needed at the loader site. Choice rationale: `defer()` is exported from `@tanstack/react-router` v1.169 but is not required at the producer side — `<Await>` runs `reactUse(promise)` first and falls back to `defer()` itself, so the loader returning bare promises is the simpler, idiomatic shape and matches what the framework `Await` consumes verbatim.
- **Multi-collection: ALL collections, stacked.** The phase-2 related-games promise resolves to `RelatedCollectionSection[]` — one entry per IGDB collection associated with the game. The route renders them as a single `<h2>Related games</h2>` followed by stacked `<h3>{collectionName}</h3>` + `<RelatedGamesInfiniteList/>` blocks. **No Tabs primitive.** Radix Tabs port is deferred to Slice 18A; stacked sections are the dumbest-thing-that-works substitute and parities the visual hierarchy without the new primitive.
- **Per-collection failure semantics: `Promise.allSettled` + filter.** If some collections succeed and others fail, the survivors are rendered and the failures are logged. If EVERY collection fails (or the collections fetch itself throws), the related-games section's `<Await>` rejects and the per-section error boundary surfaces an inline `role="alert"` ("Couldn't load related games") underneath the preserved `<h2>` — the section header stays in flow per decision 4. Empty collection list → the section is omitted entirely (the page still renders without an empty heading).
- **Times-to-beat: minimal UI, raw seconds at the entity layer.** `entities/game/api/get-times-to-beat.server.ts` returns `{ mainStory: number | null; completionist: number | null }` in seconds (or `null` when IGDB has no record). `features/game-detail/ui/times-to-beat-section/` is a minimal `<section>` + `<h2>Times to beat</h2>` + 2-row `<dl>` (Main story / Completionist) with hours rounded to one decimal. No bar charts, no completion strip, no community-average widget — full visual port belongs to Slice 18A.
- **Cache-miss accepts one duplicate IGDB call.** Symmetry across cache states beats saving one IGDB roundtrip on a one-time cache-miss. The body fetch in `get-game-by-slug.ts` no longer carries `collections`; the deferred phase always re-fetches via `getGameCollectionsByIgdbId({ igdbId })`. Same applies to times-to-beat.
- **Slot-based widget composition.** `widgets/game-detail/ui/game-detail/` no longer takes `relatedGamesSection` directly. It exposes two optional `ReactNode` slots — `relatedGamesSlot` and `timesToBeatSlot` — that the route fills with `<Suspense fallback>` + `<Await promise>` wrapped in a small per-section error boundary. Keeps the widget pure and unit-testable; the Suspense plumbing lives entirely in the route file.
- **Per-section `<ErrorBoundary>` is a tiny inline class.** React still does not ship a built-in error boundary; the route file contains a minimal 12-line `SectionErrorBoundary` class component. Lifted to a shared module only if a third caller appears.
- **Worker contract for `getRelatedGames` unchanged.** `RelatedGamesInfiniteList` props unchanged. Existing tests for both stay green.

## Intentional divergences (Slice 14)

> **Superseded** in part by [Slice 14 — phase-2 streaming](#intentional-divergences-slice-14--phase-2-streaming) above. The Path-A "transient `collections` on `GameDetails`" trade-off below was abandoned because cache-hit pages rendered no related games. The worker / component / search-param contract documented below is still current.

`features/browse-related-games/` ships the infinite-scroll related-games surface for `/games/$slug`. Slice is GREEN when (a) the worker `getRelatedGames` returns paginated, ALLOWED_GAME_CATEGORIES-filtered IGDB collection games, (b) the `RelatedGamesInfiniteList` component appends pages on sentinel intersection while keeping the URL `?page=N` in sync, (c) the route loader prefetches page 1 of the first collection so SSR delivers a non-empty list.

- **Worker / server-fn split applied (foot-gun #8).** Worker at `features/browse-related-games/api/get-related-games.worker.ts` (plain async, test-importable, throws `AppError` directly). Server-fn wrapper at `features/browse-related-games/api/get-related-games.ts` (NO `.server` suffix per foot-gun #1) — `createServerFn({ method: "GET" })` with Zod `inputValidator`, delegates to the worker.
- **No DB upsert in the worker (read-through only).** Browsing a collection is read-only; upsert happens in the add-game flow when the user clicks a specific game. The integration test pins the Game-table row count at 0 after the call.
- **Component is Variant B (hybrid client-append), not Variant A (pure router-driven).** Pure loader-driven pagination cannot accumulate pages without a parent accumulator that doesn't exist in the route layer; Variant B keeps appended games in local component state and calls `getRelatedGamesFn` directly for pages 2+ (no TanStack Query introduced — honors the spec constraint). The URL is kept in sync via `router.navigate({ search: { page }, replace: true })` so deep-linking reflects the furthest page scrolled to.
- **Search-param schema declared on the route.** `src/routes/games.$slug.tsx` declares `validateSearch: searchSchema.parse` accepting `{ page?: number ≥ 1 }`. The route component does not currently read `page` to seed render — the SSR `firstPage` is always page 1 — but the schema is the durable surface for future deep-linking semantics (e.g., scroll-restore on back-nav). The infinite-list updates `page` via `router.navigate({ search, replace: true })` after each successful fetch.
- **Path A chosen for game-detail wiring.** `entities/game/api/get-game-details.server.ts` extended with `collections: GameCollectionRef[]` (transient, NOT persisted on the Game model). On cache-MISS, collections are derived from the IGDB payload (`collections.id, collections.name` added to `GAME_FIELDS` in `get-game-by-slug.ts`). On cache-HIT (slug already in `Game` table), collections come back as `[]` because the column doesn't exist on the model — **acceptable trade-off**: avoids a Prisma migration and keeps cache-hit zero-network. The page-data server fn (`features/game-detail/api/get-game-detail-page-data.ts`) prefetches page 1 of the first collection and surfaces it as `relatedGamesSection: { collectionId, collectionName, pageSize, firstPage }` on the loader payload. Cache-hit pages render without a related-games section.
- **Best-effort prefetch (no failure escalation).** If the related-games prefetch throws (`NotFoundError` for an empty collection, `UpstreamError` for IGDB transport), the page-data fn logs and returns `relatedGamesSection: null` — the page renders without the section rather than 5xx-ing the entire game detail. Verified manually; not yet covered by an integration test.
- **Widget composition.** `widgets/game-detail/ui/game-detail/` accepts an optional `relatedGamesSection` prop and renders `<RelatedGamesInfiniteList/>` inside an `<h2>Related games</h2>` section when present. Anonymous viewers see related games (no auth requirement — collections are public).
- **`<img>` everywhere, no `next/image`.** Cover URLs built via the existing `buildCoverImageUrl` helper from `entities/library-item/ui/library-item-card/library-item-card.utility`. Plain placeholder `<div role="img" aria-label="Cover for {title}">` when `coverImageId` is null — satisfies the test's `getByRole("img", { name: "Cover for ..." })` query for both rendered and missing-cover states.
- **Pre-existing failure fixed in scope (project rule).** `library-item-card.test.tsx` had 9 failing tests after the slice-13 `<Link to="/games/$slug">` addition (rendered without a `RouterProvider`). Added a `vi.mock("@tanstack/react-router")` matching the `landing-hero.test.tsx` precedent (resolves `to + params` → plain `<a>`). Also added a typecheck-required `search={{ page: 1 }}` on the `<Link>` itself because the route now declares `validateSearch`.

## Intentional divergences (Slice 13)

`entities/game/api/get-game-details.server.ts` orchestrates the game-detail page read. The contract returns `{ game, relatedGames, libraryEntry, journalTeaser }`; the slice is GREEN when slug → cached `Game` resolves, viewer-scoped `LibraryItem` and recent `JournalEntry[]` (max 3, desc `createdAt`) load correctly, and a missing slug throws `NotFoundError`.

- **`relatedGames` returns `[]`.** The canonical app derives related games via genre / franchise; tanstack defers that until the supporting columns and indexes land. The integration test only asserts `Array.isArray`, so `[]` is contract-conformant. To be revisited when Slice 13 ships SEO/related sections.
- **Cache-first slug lookup.** The orchestrator queries `prisma.game.findUnique({ where: { slug } })` BEFORE calling IGDB. The cache-hit test (line 404 of `get-game-details.integration.test.ts`) pins this: a strict `vi.fn()` is stubbed in after the first call, and the second call must not invoke fetch. Querying IGDB first and then upserting would still pass the assertion via the `igdbId` cache hit inside `upsertGameFromIgdbPayload`, but the slug-first branch keeps a guaranteed zero-network path on warm caches and avoids depending on IGDB returning the same `igdbId` for a slug across calls.
- **`upsertGameFromIgdbPayload` sibling added.** The existing `upsertGameFromIgdb(igdbId)` re-fetches IGDB by id even when the caller already has the payload — that would double the IGDB calls per slug-resolution. Added a sibling `upsertGameFromIgdbPayload(payload)` with the same insert logic; `upsertGameFromIgdb` now delegates to it on cache miss. Existing callers (`features/add-game/api/add-game-to-library-fn.ts`) keep their signature.
- **Journal teaser limit hard-coded to 3.** The teaser is a UI affordance, not a paginated list — magic number lives at the entity layer (`JOURNAL_TEASER_LIMIT`). Full journal listing belongs to a future feature server fn.
- **Privacy invariant on `libraryEntry` and `journalTeaser`.** Both Prisma queries scope by `userId` directly. No "public profile" branch yet — anonymous viewers always get `null` / `[]` for these fields. Cross-user isolation is verified by the integration test's `cross-user isolation` block.

### Slice 13 / Task 4 — game-detail UI primitives + widget composition

The canonical `savepoint-app/features/game-detail/ui/` ships ~12 components for the detail page. Tanstack collapses to **3 entity primitives + 1 entity teaser + 1 widget composer**:

- **`entities/game/ui/game-cover/`** — replaces `game-cover-image.tsx`. Plain `<img>` with `<div role="img">` placeholder fallback; no `next/image`.
- **`entities/game/ui/game-metadata/`** — collapses `game-detail-hero.tsx` + `game-description.tsx` + `game-release-date.tsx` into one block: `<h1>` title, `<time>` release date, `<p>` summary. Date uses bare `<time>` (no `<p>` wrapper) so the test's `queryByRole("paragraph")` reliably distinguishes summary presence.
- **`entities/library-item/ui/library-status-strip/`** — collapses the canonical `library-status-dropdown-pill.tsx` + `library-status-segmented.tsx` dual-surface into a single read-only strip (status pill + optional rating + optional platform). Mutation surfaces are reached via the `manage-library-entry` modal in CTA wiring (Task 6), not via inline pill/segmented controls. Reuses `getStatusLabel` from `entities/library-item/model` for label parity with `library-item-card`.
- **`entities/journal-entry/ui/journal-teaser/`** — read-only teaser; compose / edit lives in Slice 16 (`journal-entries-section.tsx`'s dialog logic deferred). Empty state `<p>No journal entries yet.</p>`; otherwise an `<ul aria-label="Recent journal entries">` of date + title + line-clamped snippet. No `next/link`.
- **`widgets/game-detail/ui/game-detail/`** — composes the four primitives. Cover (left/top, max-w-xs) + metadata (right/below) in `flex md:flex-row`; status strip rendered when `libraryEntry !== null`; journal teaser section rendered when `viewerUserId !== null` (anonymous viewers see no teaser, matching the entity-layer privacy invariant). `relatedGames` threaded through but unused — Slice 14.

**Dropped from this task:** `playtime-section.tsx`, `actual-playtime.tsx`, `times-to-beat-section.tsx`, `library-rating-control.tsx` (interactive), `add-to-library-button.tsx`, `game-not-found.tsx`. Playtime / times-to-beat fields are on the `Game` model but not surfaced yet — additive when needed. CTAs (add-to-library, edit-entry) are Task 6. `game-not-found` is the route-level error component, also Task 6.

**Cover-size pre-existing fix.** `entities/library-item/ui/library-item-card/library-item-card.utility.ts` `buildCoverImageUrl` default was `t_cover_big_2x` but the co-located test pinned `t_cover_big`. Per the project rule "fix any pre-existing issue in scope," default reverted to `t_cover_big`. The widget passes `t_cover_big_2x` explicitly for the larger detail-page cover.

### Slice 13 / Task 5 — `/games/$slug` route wiring

- **Public route, not under `_authed/`.** The route lives at `src/routes/games.$slug.tsx` and is accessible to anonymous viewers. `userId` is read from the server-side session ONLY (via `getServerUserId(request)` inside the loader's server fn) — never from URL/search params.
- **Loader-only feature server fn introduced.** `features/game-detail/api/get-game-detail-page-data.ts` exports `getGameDetailPageDataFn` (`createServerFn`, no `.server` suffix). Its only consumer is the route loader, which by the strict feature-server-fn rule should be a loader-direct read — but foot-gun #2 (CLAUDE.md) makes that unsafe (the route extractor doesn't strip `.server.ts` imports from client preload, hanging the app on hover-preload). The wrapper is the documented escape hatch. It returns `{ data, viewerUserId }` so the widget gets `viewerUserId` without a second round-trip on the client.
- **Route `errorComponent` branches on `AppError.code === "NOT_FOUND"`.** `NotFoundError` (thrown by `getGameDetails` when IGDB returns no match for the slug) renders a friendly "Game not found" surface with a `<Link to="/">Go home</Link>`; any other error renders a generic "Something went wrong" surface with the same home link. The route does NOT delegate to the root `ErrorBoundary` — the canonical app's `game-not-found.tsx` shipped a route-scoped 404 surface, and the same shape is preserved here. Internal links use `@tanstack/react-router`'s `Link`, never `next/link`.
- **Route test placed at `src/routes/-games.$slug.test.tsx`.** The leading `-` keeps the test file out of TanStack Router's file-route generation (mirrors the existing `-_authed.test.tsx`, `-index.test.tsx` precedent). The test mocks `@tanstack/react-router`'s `createFileRoute` to return a passthrough `{ options }` shape so the test can drive `Route.options.component` / `Route.options.errorComponent` / `Route.options.loader` directly without a router runtime. Coverage: signed-in path forwards `viewerUserId`; anonymous path forwards `null`; `NotFoundError` thrown into `errorComponent` renders the 404 surface; non-`NotFoundError` renders the generic surface; loader calls `getGameDetailPageDataFn({ data: { slug } })`. +8 unit tests (287 → 295).

**Test path fix.** `library-status-strip.test.tsx` shipped from RED with a 4-segment `../../../../shared/lib/prisma/client.ts` import; correct depth from `src/entities/library-item/ui/library-status-strip/` is 5. Repaired without touching test logic.

## Intentional divergences (Slice 11)

`features/manage-library-entry/ui/library-modal/` collapses the canonical `savepoint-app/features/manage-library-entry/ui/` structure aggressively. The slice is GREEN when status / rating / platform / date editing works through `updateLibraryItemFn` and deletion through `deleteLibraryItemFn`; UX surfaces beyond that are deliberately omitted.

- **`desktop-layout.tsx` / `mobile-layout.tsx` collapsed.** Single responsive form inside `<DialogContent>`; no viewport switch.
- **`edit-entry-form.tsx` inlined.** Form lives directly in `library-modal.tsx`; no separate form component.
- **`status-select.tsx` / `status-chip-group.tsx` collapsed into a single native `<select aria-label="Status">`.** Native `<select>` matches slice 9's `library-filters.tsx` precedent and is reachable by `getByRole("combobox", { name: "Status" })` without porting Radix `Select`. No new shadcn primitive added.
- **`platform-combobox.tsx` replaced with native `<select aria-label="Platform">`.** Same rationale as Status. Accepts a fixed list of platforms plus the entry's current platform if it isn't in the canonical list (preserves out-of-list values).
- **`date-field.tsx` / `date-fields-collapsible.tsx` collapsed and flattened.** Two flat `<input type="text" pattern="\d{4}-\d{2}-\d{2}">` fields ("Started", "Completed"). `type="text"` rather than `type="date"` because jsdom does not assign `role="textbox"` to date inputs, and the test locks `role="textbox"`. No collapsible reveal — both dates always visible.
- **`library-entry-metadata.tsx` (cover thumbnail + title display) omitted.** Game title surfaces only as `<DialogTitle>{entry.game.title}</DialogTitle>`. Cover thumbnail not rendered.
- **Toasts + `router.invalidate()` wired in tasks.md line 232 (feedback sub-task).** On update success: `toast.success("Library entry updated")` → `router.invalidate()` → `onOpenChange(false)`. On delete success: `toast.success("Removed from library")` → `router.invalidate()` → `onOpenChange(false)`. On either rejection: `toast.error(message)` AND inline `role="alert"` (additive — toast is the transient channel, inline alert is the persistent a11y channel for screen-reader users who miss the toast). Mirrors the `AddGameModal` (Slice 10) and `AvatarUpload` (Slice 6) precedents — the component that fires the mutation owns its full cycle (call → toast → invalidate → close). Lifecycle calls happen inside the `try` block, so a rejection path leaves the modal open and skips invalidation.
- **Delete confirmation is a SINGLE inline surface, not the canonical two-surface split.** Canonical `savepoint-app/` ships both `delete-confirmation-dialog.tsx` (shadcn `AlertDialog`-based) and `inline-delete-confirm.tsx` (compact inline confirm); tanstack collapses to one. A controlled boolean swaps the "Remove from library" trigger for an inline `Confirm` / `Cancel` pair within the same `DialogContent`. No new shadcn primitive added; no second surface ported. The two-surface split adds no value when the modal itself is already a focus trap and the action lives entirely within it.
- **Save closes on success.** As of the line 232 feedback wiring, `onOpenChange(false)` is called after `updateLibraryItemFn` resolves AND after `deleteLibraryItemFn` resolves. The parent stays a pure controller — modal owns its own close-on-success.
- **Patch shape on save.** All five fields (status, platform, rating, startedAt, completedAt) are sent on every submit, with empty-string platform → `null`, empty-string rating → `null`, empty-string date → `null`. Relies on the entity layer's `undefined`-filter for no-ops; we never send `undefined` here.

## Known gaps (Slice 14A — UI parity)

Scope: 14A's "GREEN (other in-scope hand-rolled surfaces)" subtask. Worklist driven by [`context/spec/021-migrate-to-tanstack-start/audits/14A-ui-gap-matrix.md`](../context/spec/021-migrate-to-tanstack-start/audits/14A-ui-gap-matrix.md). Each row below is a gap-matrix entry whose action was "waive" (or whose port was partial), with the rationale captured for the cutover review. Ported rows are not listed — they're closed in commit history.

### SidebarSearchTrigger (gap-matrix row 2)

**Status:** Deferred to 18A (S17 command palette).
**Canonical behavior:** A `SidebarMenuButton` opens the global command palette via `useCommandPaletteContext().open()`; ⌘K binding lives there.
**Tanstack behavior:** Plain `<button>` with a `⌘K` kbd affordance — no palette feature wired.
**Rationale:** The command palette is owned by S17. Wiring this trigger before the palette ships is premature; the audit explicitly defers this row.

### SidebarNavLinks / shadcn `Sidebar` primitive (gap-matrix row 3)

**Status:** Waived (slice 14A).
**Canonical behavior:** Full shadcn `Sidebar` provider + `SidebarMenuButton` with collapsible-icon mode and tooltip-on-collapse.
**Tanstack behavior:** Hand-rolled `<aside>` + TanStack `<Link activeProps>`.
**Rationale:** shadcn `Sidebar` is a >500-line primitive with cookie-backed collapse state, provider context, and a Radix sub-tree, with no other consumer in the tanstack tree. Persistent full-width sidebar is correct for the current layout. Revisit if a collapsed-icon mode becomes a requirement.

### AddGameTrigger quick-add Popover (gap-matrix row 13)

**Status:** Waived (slice 14A).
**Canonical behavior:** Two add-game surfaces — full `Dialog`-based form AND a `Popover`-based "quick add" anchored on library-card hover.
**Tanstack behavior:** Single `Dialog` path via `AddGameTrigger`.
**Rationale:** The Popover quick-add is a progressive-enhancement convenience, not a primary flow. Library cards do not yet host a hover quick-add anchor in tanstack. Revisit if hover-state CTAs are added.

### AddGameModal — shadcn `Form` (gap-matrix row 14)

**Status:** Waived (slice 14A).
**Canonical behavior:** shadcn `Form` (FormItem + FormControl + FormMessage) wraps the search input.
**Tanstack behavior:** Plain `<form>` + `<label>` + `Input`.
**Rationale:** The add-game search form is single-field; shadcn `Form` adds no observable value. Porting `Form` would block on Radix-form's react-hook-form integration without a corresponding UX gain.

### LibraryModal Platform combobox-with-search (gap-matrix row 16)

**Status:** Partially ported — Select adopted; Popover+Command search-to-filter waived.
**Canonical behavior:** `PlatformCombobox` uses `Popover` + `Command` for search-to-filter over a long platform list.
**Tanstack behavior:** Radix `Select` with the same fixed 6-platform list.
**Rationale:** Tanstack ships only 6 hard-coded platforms. Search-to-filter adds no value at that cardinality; the keyboard-nav and visual-parity benefits of Radix `Select` close the major UX gap from the previous native `<select>`. Revisit when the platform list is fetched dynamically (canonical's full list ~100+).

### LibraryModal desktop/mobile split (gap-matrix row 18)

**Status:** Waived (slice 11; reaffirmed in 14A).
**Canonical behavior:** Separate `DesktopLayout` / `MobileLayout` form components.
**Tanstack behavior:** Single responsive `Dialog` form.
**Rationale:** Documented in the slice-11 divergence above — collapsing simplifies code without user-visible harm.

### LibraryModal entry metadata thumbnail (gap-matrix row 19)

**Status:** Waived (slice 11; reaffirmed in 14A).
**Canonical behavior:** Cover thumbnail + title rendered in the modal header via `LibraryEntryMetadata`.
**Tanstack behavior:** `DialogTitle` text only.
**Rationale:** Game title in `DialogTitle` satisfies the accessible name requirement. Cover adds visual richness but not functional parity. Revisit if design review deems the cover load-bearing for context.

### GameDetailHero ⋯ DropdownMenu button (sub-row of gap-matrix row 21)

**Status:** Waived (slice 14A).
**Canonical behavior:** Inline `DropdownMenu` with a single "Edit library entry" item next to the status cluster.
**Tanstack behavior:** No ⋯ button.
**Rationale:** The only canonical menu item duplicates `ManageFromGameDetailButton`, which is already rendered prominently in the hero for users with library entries. Adding the ⋯ button would create two near-identical affordances. Revisit if additional per-entry actions land that don't fit on the manage modal.

### GameDetailHero banner + studio/genre eyebrow (sub-row of gap-matrix row 21)

**Status:** Deferred to 18A.
**Canonical behavior:** Cover-blurred banner with a two-layer gradient overlay; eyebrow renders year · studio · top-2 genres.
**Tanstack behavior:** No banner; eyebrow renders release year only.
**Rationale:** Banner needs a screenshot/artwork URL on the `Game` model — schema bleed outside 14A scope. Studio + genre rendering needs `getGameDetails` to select `companies` and `genres` relations. Both are entity-query extensions that warrant a dedicated 18A row.

### RelatedGamesSection — Tabs + ScrollArea (gap-matrix row 25)

**Status:** Deferred to 18A (per slice 14 phase-2 streaming divergence).
**Canonical behavior:** `Tabs` switches between collections; `ScrollArea` for the inner list.
**Tanstack behavior:** Stacked `<h3>` sections per collection; native `overflow-y-auto`.
**Rationale:** Radix `Tabs` is not yet ported; stacked sections are the documented interim shape.

### RelatedGameCard — full GameCard widget port (sub-row of gap-matrix row 26)

**Status:** Partially ported — Tooltip adopted; full `GameCard` compound widget waived.
**Canonical behavior:** Compound `Card` with header/footer/meta + genre `Badge`s.
**Tanstack behavior:** Inline `<li>` with cover, tooltip-wrapped title, no genre chips, no compound card chrome.
**Rationale:** Genre chips need genre data on `RelatedGame` (currently absent — collections payload doesn't carry genres). The compound card adds chrome without functional parity. Revisit when genre data lands.

### RelatedGamesSkeleton — shadcn `Skeleton` (gap-matrix row 27)

**Status:** Waived (slice 14A).
**Canonical behavior:** Uses shadcn `Skeleton` primitive.
**Tanstack behavior:** Hand-rolled `animate-pulse` divs.
**Rationale:** shadcn `Skeleton` is a thin wrapper around `bg-muted animate-pulse`. Functionally equivalent. Port if a third caller lands; standalone, the primitive overhead isn't justified.

### TimesToBeatSection (gap-matrix row 24)

**Status:** Waived (slice 14A; matches the slice-14 phase-2 divergence above).
**Canonical behavior:** Bar charts, completion strip, community-average widget.
**Tanstack behavior:** Minimal `<dl>` with main story / completionist hours.
**Rationale:** Spec calls out full visual port as 18A. Minimal `<dl>` is the documented interim.

### ProfilePage tabs + social actions (gap-matrix row 30)

**Status:** Waived (intentional architectural pivot).
**Canonical behavior:** Tabbed profile (Overview / Library / Activity) + DropdownMenu follow menu, follower counts.
**Tanstack behavior:** Flat `<ProfileOverview/>`.
**Rationale:** Tabs and social are S18 (settings/social) territory. The avatar + stats + edit-profile CTA portions are already ported.

### JournalTeaser — interactive "Add entry" CTA (gap-matrix row 29)

**Status:** Deferred to 18A (S15/S16 journal feature).
**Canonical behavior:** Inline "Add entry" CTA opens a journal compose dialog.
**Tanstack behavior:** Read-only entries list only.
**Rationale:** Journal compose/edit is owned by S15/S16. The read-only teaser is correct for 14A — typography is aligned (text-sm + text-xs hierarchy mirrors canonical).
