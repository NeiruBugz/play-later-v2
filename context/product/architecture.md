# System Architecture Overview: SavePoint

> **Migrated to TanStack Start (spec 021, cut over 2026-05).** SavePoint was rebuilt from Next.js 16 (App Router) onto **TanStack Start v1**. The deployed application is `savepoint-tanstack/`; the former `savepoint-app/` (Next.js) is retained briefly as rollback insurance and will be deleted one release cycle after cutover. This document describes the **TanStack Start architecture as deployed**. The migration was user-invisible: same Postgres data, same Better Auth sessions, same URLs. Migration spec: `context/spec/021-migrate-to-tanstack-start/`.

---

## 1. Application & Technology Stack

**Full-Stack Framework:** TanStack Start v1 (`@tanstack/react-start`) on Vite 8 (Rolldown) + **Nitro** server engine

- **Routing:** TanStack Router (file-based) under `savepoint-tanstack/src/routes/`. `$param` for dynamic segments, `_authed/` pathless layout for guarded routes, `routes/api/*` for Web Request handlers. Generated `routeTree.gen.ts` is committed.
- **Server functions:** `createServerFn` for mutations and authed/client-callable reads; route `loader`s for read paths.
- **No RSC.** Every component is client-bundle eligible; data flows via loaders + server fns. There is no `"use cache"` / Server Components model — read-path caching uses TanStack Router's loader `staleTime`/`gcTime` and, where streamed, TanStack Query.
- **React 19 + TypeScript (strict).**

**Frontend Stack:**

- **UI Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Component Library:** shadcn/ui primitives, ported into `src/shared/ui/`
- **Server state:** TanStack Query (`@tanstack/react-query` + `react-router-ssr-query`) for streamed/client-refetchable surfaces (e.g. game-detail related games via `useSuspenseQuery`); most reads are loader-driven
- **Form Handling:** React Hook Form with Zod validation

**Data Flow Architecture — the "C2" DAL (two layers, throw-on-error):**

The TanStack rewrite deliberately replaced the prior four-layer (handler → use-case → service → repository) architecture and its `Result` wrappers with a **two-layer DAL that throws typed errors**:

```
┌───────────────────────────────────────────────────────────┐
│ routes/  — thin loaders + route components                │
│ - loader reads via a loader-safe createServerFn            │
│ - beforeLoad guards (auth redirects)                       │
│ - errorComponent branches on AppError.code                 │
└───────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────┐
│ features/<intent>/api/  — createServerFn wrappers          │
│ - .inputValidator(Zod) + re-parse in handler (validate-2x) │
│ - resolve userId via requireUserId() (throws)              │
│ - delegate to entity queries / a worker (foot-gun #8 split)│
└───────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────┐
│ entities/<noun>/api/*.server.ts  — domain queries          │
│ - plain async, direct Prisma                               │
│ - throw AppError subclasses on failure                     │
│ - privacy/ownership invariants live HERE                   │
└───────────────────────────────────────────────────────────┘
                          ↓
                 Prisma ORM → PostgreSQL
```

- **No Result wrappers, no service classes, no domain mappers, no handler/use-case/repository split.** Errors throw; routes catch via `errorComponent`.
- **`AppError` catalog (exactly 5):** `NotFoundError`, `ConflictError`, `ValidationError`, `UnauthorizedError`, `UpstreamError`. New subclasses require spec review. Prisma constraint errors are mapped to `AppError` in exactly one place (the entity update query).
- **`.server.ts` is a bundler boundary**, not just a naming tag: TanStack Start's `import-protection` plugin forbids `**/*.server.*` from the client bundle. Entity queries / db / auth are `.server.ts`; `createServerFn` files are **not** (`.server.ts` would break the RPC bridge). Public barrels must not re-export server-only values into client-reachable surfaces.

**Import Aliases:** `@/*` (and `#/*`) → `savepoint-tanstack/src/*`; `@env` → typed env at `savepoint-tanstack/env.ts`. `process.env.*` is read only inside `env.ts`.

---

## 2. Authentication & Authorization

**Authentication Runtime:** Better Auth (`betterAuth({...})` in `savepoint-tanstack/src/shared/lib/auth.server.ts`)

- **Primary identity provider:** AWS Cognito (Google federation), via `socialProviders.cognito`
- **Account linking:** `accountLinking.enabled = true`, `trustedProviders: ["cognito"]` — accounts auto-link on `accountId = <cognito-sub>` (no user fork)
- **Email+password:** enabled only when `AUTH_ENABLE_CREDENTIALS=true` (non-prod / E2E)
- **Route mount:** `routes/api/auth/$.ts` returns `auth.handler(request)` directly (Web Request/Response). `basePath: "/api/auth"`. No `toNextJsHandler`, no `nextCookies()` plugin — TanStack Start passes Better Auth's `Set-Cookie` headers through natively.

**Session Management:**

- DB sessions in the PostgreSQL `session` table (not JWT) via `prismaAdapter`
- Server-side lookup: `getServerUserId(request)` reads the request `Headers` and calls `auth.api.getSession({ headers })` → `string | undefined`
- Auth gates: **`requireUserId()`** in handlers (throws `UnauthorizedError`); **`requireUserIdOrRedirectFn`** in route `beforeLoad` (redirects to `/login`); raw `getServerUserId` only for anonymous-allowed reads
- Client sign-out: `authClient.signOut()` + `router.invalidate()`

**Cross-app session continuity (cutover):** the migration shares the same `BETTER_AUTH_SECRET`, cookie name/domain, and `session` table as the legacy app, so sessions interoperate and survive cutover with no re-login (verified by the Slice 23 cross-app session audit).

**Authorization principles:**

- All mutations require an authenticated session; `userId` is resolved server-side, never trusted from input
- **Privacy/ownership invariants live on the entity query** — they throw `NotFoundError` for both "missing" and "not yours" (anti-enumeration), so a network-callable `createServerFn` cannot bypass a route-layer gate

---

## 3. Data & Persistence

**Primary Database:** PostgreSQL

- **Production:** Neon (serverless Postgres, pooled + non-pooling URLs)
- **Local:** Docker Compose on `localhost:6432`
- Relational model: users, games (IGDB metadata cache), library items, journal entries, collections, follows, imported (Steam) games

**ORM Layer:** Prisma

- Generated client outputs into the **source tree** at `savepoint-tanstack/src/shared/lib/prisma/` (gitignored), so `build` runs `prisma generate && vite build` to produce it on a fresh checkout (e.g. Vercel)
- `prisma.config.ts` loads the DB URL from `process.env` (and `.env` locally) — required at config-load even for generate
- **Migration ownership:** during the parallel-run the schema was mirrored from `savepoint-app/` (canonical) and CI diff-checked; as `savepoint-app/` is retired, migration ownership moves to `savepoint-tanstack/`

**Caching Strategy:**

- **Read-path caching:** TanStack Router loader `staleTime`/`gcTime` (replaces the former Next.js `"use cache"` model) — revisited routes serve cached loader data without a server round-trip
- **IGDB response caching:** game metadata persisted in the PostgreSQL `Game` table acts as a durable cache
- **Distributed cache (optional):** Upstash Redis (`UPSTASH_REDIS_REST_*`) for hot-path read-through / rate-limit primitives

---

## 4. External Services & APIs

**Game Metadata:** IGDB

- Token cache + REST client in `src/shared/api/igdb/`; OAuth token refreshed lazily with a 60s safety margin
- Search/detail exposed as entity queries (`entities/game/api/*.server.ts`, e.g. `searchGames`, `getGameDetails`, `getRelatedGames`, `getTimesToBeat`) wrapped by feature `createServerFn`s
- First-lookup games are upserted into the local `Game` table (durable cache)

**Steam:** account connect/disconnect + profile read are active (OpenID assertion verified against Steam before trust). Library import / sync surfaces exist but the AWS Lambda enrichment pipeline that powered deep sync was retired (spec 015); PSN/Xbox remain paused on the same dependency.

**File Storage (avatars):** AWS S3 (LocalStack locally). Presigned PUT via `getAvatarPresignedUrlFn` (MIME allow-list + 10 MB cap, enforced server-side); key scoped `${S3_AVATAR_PATH_PREFIX}${userId}/${uuid}.<ext>`.

**Integration patterns:** external calls are wrapped at the `shared/api/<service>/` boundary and surface failures as `UpstreamError`; IGDB/Steam base URLs are hardcoded (no user-controlled URL construction → no SSRF).

---

## 5. Infrastructure & Deployment

**Hosting:** **Vercel** (single project; Root Directory = `savepoint-tanstack/`)

- TanStack Start builds through **Nitro**; Nitro auto-selects its **Vercel preset** from the `VERCEL` env var at build time (locally it uses the `node-server` preset → `.output/server/index.mjs`). No `vercel.json` — the project's dashboard settings handle the pnpm-workspace monorepo (install at workspace root, build `pnpm --filter savepoint-tanstack build`).
- **Cutover** = swapping the Vercel project Root Directory to `savepoint-tanstack/`. Rollback = revert it; no data migration to undo (shared DB). Runbook: `savepoint-tanstack/docs/{vercel-deployment,cutover-rollback}.md`.

**Database:** Neon (managed Postgres).

**File Storage / Auth:** AWS S3 (avatars) + AWS Cognito (identity). Both provisioned via Terraform in `infra/` (currently Cognito + S3 modules).

**Infrastructure as Code:** Terraform (`infra/`), `dev` / `prod` envs, local state per env.

**Local Development:**

- Docker Compose: PostgreSQL (`:6432`), pgAdmin (`:5050`), LocalStack S3 (`:4568`)
- Dev server: `pnpm --filter savepoint-tanstack dev` on `localhost:6060`
- Env via `.env` (never committed; `.env.example` provided); all keys validated by `env.ts`

**CI/CD (GitHub Actions):** `pr-checks-tanstack.yml`, path-conditional on `savepoint-tanstack/**`

- Format check, ESLint (incl. **alias-aware** `eslint-plugin-boundaries` FSD enforcement), TypeScript typecheck
- **Production build** (`prisma generate && vite build`) — catches client/server bundler-graph breaks the type/lint/test steps miss
- **Merged unit + integration coverage** gate (v8): statements ≥ 85% on `src/{entities,features}` is the cutover gate; branches/lines/functions are regression floors
- Prisma schema drift check (parity between the two apps during the retirement window)

---

## 6. Observability & Monitoring

- **Application logging:** Pino (structured JSON), surfaced through Vercel's runtime/function logs. Log levels `error`/`warn`/`info`/`debug` configurable via `LOG_LEVEL`.
- **Platform:** Vercel deployment + function logs and built-in analytics for request/latency/error signals.
- **Database:** Neon's built-in metrics + slow-query insight.
- **Solo-developer context:** observability stays platform-native (Vercel + Neon) to minimize operational overhead — no self-managed CloudWatch/APM stack.

---

## 7. Testing Strategy

**Philosophy:** TDD per slice (tests precede implementation for query + server functions). Integration tests use a real PostgreSQL DB.

**Vitest — two projects:**

- **`unit`** (`*.unit.test.ts`, `*.test.tsx`): jsdom for components, node for logic; Prisma mocked. Fast.
- **`integration`** (`*.integration.test.ts`): node + real PostgreSQL (per-test isolated DB), run sequentially. Worker-split features import the **worker**, not the `createServerFn` wrapper (foot-gun #8).

**Coverage:** merged unit+integration v8 report over `src/{entities,features}` (barrels/types excluded). Enforced thresholds: **statements 85** (the cutover gate), with branches/lines/functions as regression floors. `pnpm --filter savepoint-tanstack test:coverage` runs both projects + enforces. Current suite: ~1615 tests across unit + integration.

**Conventions:** element/action vocabulary maps, given/when/then `describe` nesting, arrange-in-`beforeEach`, strings-over-regex queries; tests verify user-observable behavior, not call-envelope shape. Regression guards live in `test/eslint/` (FSD boundary + alias resolution) and `test/canary/` (harness wiring) — do not delete.

**E2E:** deferred (added after cutover stabilizes).

---

## 8. Security Considerations

- **Auth:** Better Auth session tokens in httpOnly cookies; CSRF handling built in; Cognito OAuth upstream; credentials provider gated to non-prod.
- **Authorization:** every mutation requires a validated session; `userId` resolved server-side via `requireUserId()` (never from client input); **privacy invariants enforced at the entity layer** (throw `NotFoundError` for missing-or-denied) so RPC calls can't bypass route gates.
- **Input validation:** Zod **validate-twice** (`inputValidator` + handler re-parse, since programmatic callers bypass the network validator); Prisma parameterized queries; ID inputs use `z.string().min(1)` (Better Auth emits 32-char nanoids, never `.cuid()`).
- **Bundler boundary:** `import-protection` keeps `.server.*` modules (db, auth, secrets, entity queries) out of the client bundle; public barrels expose only client-safe surface.
- **Secrets:** all via `env.ts`-validated env vars; `.env` never committed; S3 presign enforces MIME + size; Steam OpenID assertion verified before trust.
- **Dependencies:** exact-pinned versions; lockfile committed; Dependabot.

---

## 9. Feature-Sliced Design (FSD) Architecture

`savepoint-tanstack/src/` is organized in canonical FSD layers (top imports down only):

```
app  →  routes  →  widgets  →  features  →  entities  →  shared
```

| Layer | Holds |
|---|---|
| `app/` | providers, root wiring, global styles, root error boundary |
| `routes/` | TanStack file-based routes — thin loaders + route components |
| `widgets/` | composite UI blocks (header, profile overview, library page, game detail) |
| `features/` | user-intent slices — `model/` (schemas+types), `api/` (server fns + workers), `ui/` |
| `entities/` | domain nouns — `model/`, `api/` (`.server.ts` queries throwing `AppError`), `ui/` (display-only) |
| `shared/` | `lib/` (db, logger, errors, auth), `ui/` (shadcn primitives), `config/` (env), `api/` (S3, IGDB, Steam clients) |

**Import rules (enforced by `eslint-plugin-boundaries`, alias-aware):**

- Direction is strictly downward (`app > routes > widgets > features > entities > shared`).
- **No cross-slice imports inside `features/` or `entities/`** — enforced via per-slice capture groups (same-slice barrel/intra-slice imports allowed; cross-slice forbidden). Cross-feature reuse goes through `shared/` or an entity.
- **`widgets/` may compose other widgets** (documented carve-outs in `DIVERGENCES.md`).
- Server fns live in `features/*/api/`; entity queries in `entities/*/api/`. Feature fns compose entity queries; entity queries never import features.

> The boundary linter resolves the `@/` path alias (via `eslint-import-resolver-typescript`) so it actually enforces these rules on real imports — a gap fixed during the Slice 23 FSD audit, regression-guarded by `test/eslint/`.

Per-layer agent rules: `.claude/rules/tanstack/`. App conventions: `savepoint-tanstack/CLAUDE.md`; DAL vocabulary: `CONTEXT.md`; runtime traps: `FOOT-GUNS.md`; divergence log: `DIVERGENCES.md`.

---

## Architecture Decision Records

**ADR-001: Why TanStack Start (migrated from Next.js 16)?**
Spec 021 replaced the Next.js App Router foundation with TanStack Start v1 to get a simpler full-stack model (loaders + `createServerFn`, no RSC serialization), faster client-side navigation (loader caching vs per-navigation RSC round-trips — measurably faster page loads post-cutover), less framework lock-in (Vite/Nitro deploys anywhere, not just Vercel-optimized), and a leaner DAL. The migration was user-invisible (same data, sessions, URLs).

**ADR-002: Why the "C2" two-layer DAL (throw `AppError`) over the prior four-layer + `Result` types?**
The legacy app used handler → use-case → service → repository with `HandlerResult`/`ServiceResult`/`RepositoryResult` wrappers. The rewrite collapses this to **entity queries (throw) + feature `createServerFn` wrappers**, with routes catching via `errorComponent`. Fewer layers between request and data, no Result-unwrapping boilerplate, and a bounded 5-class `AppError` taxonomy. Privacy/ownership invariants live on the entity so they can't be bypassed.

**ADR-003: Why PostgreSQL + Prisma?** (unchanged) Relational model (users → library items → games → journal entries), complex filtered/joined queries, ACID for library/journal writes, mature tooling.

**ADR-004: Why Vercel + Nitro (over the previously-documented ECS Fargate/RDS plan)?**
The app deploys as Vercel serverless functions via Nitro's Vercel preset against Neon Postgres — no container/cluster/ALB/VPC to operate. This matches the solo-developer operational budget; the earlier ECS Fargate + RDS + ALB design was never deployed. Cutover and rollback are a one-line Vercel Root-Directory change with no data migration.

**ADR-005: Why FSD with alias-aware boundary enforcement?**
Canonical FSD layers with per-slice capture-group rules in `eslint-plugin-boundaries`. The Slice 23 audit found the linter wasn't resolving the `@/` alias (enforcing nothing); fixing the resolver + adding a regression guard made the boundary rules real, so violations now fail at PR time.

**ADR-006: Why LocalStack for local S3?** (unchanged) Integration-tests file-upload flows without AWS cost; production-parity S3 API; CI-friendly.

**ADR-007: Why `.server.ts` as a bundler boundary?**
TanStack Start's `import-protection` forbids `*.server.*` in the client bundle. This enforces server-only code (db, auth, entity queries) staying server-side by construction; `createServerFn` files are intentionally *not* `.server.ts` (they are the client-callable RPC bridge). Public barrels must expose only client-safe surface — re-exporting a server-only value into a client-reachable barrel breaks the production build (a class of failure the CI build gate now catches).

---

**Document Metadata:**

- **Version:** 3.0
- **Last Updated:** 2026-05-23 (TanStack Start migration — spec 021 cutover)
- **Status:** Active
- **Maintained By:** Solo developer with AI assistance
- **Review Cadence:** After each major phase completion
- **Changes in v3.0:**
  - Rewrote the document to describe the deployed **TanStack Start** (`savepoint-tanstack/`) architecture; removed the Next.js/`savepoint-app/` four-layer DAL, `createServerAction`, `Result`-type, and RSC detail (legacy app retained briefly as rollback insurance, then deleted).
  - §1: TanStack Start v1 + Vite/Nitro + the C2 two-layer DAL (throw `AppError`); `.server.ts` bundler boundary.
  - §2: Better Auth mounted via the `routes/api/auth/$.ts` catch-all (Web Request/Response, no `toNextJsHandler`/`nextCookies`); `requireUserId`/`requireUserIdOrRedirectFn` gates; cross-app session continuity.
  - §3/§5: corrected production infra to **Vercel + Neon + S3 + Cognito** (the documented ECS Fargate/RDS/ALB/VPC stack was never deployed); Prisma client generated during build.
  - §7: Vitest two-project setup + merged coverage gate (statements ≥85).
  - §9: rewrote FSD to the `app/routes/widgets/features/entities/shared` layer map with alias-aware boundary enforcement.
  - ADRs: replaced the Next.js/four-layer/ECS ADRs with TanStack Start, C2 DAL, Vercel/Nitro, FSD-enforcement, and `.server.ts`-boundary decisions.
