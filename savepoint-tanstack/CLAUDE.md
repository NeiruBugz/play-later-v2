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
