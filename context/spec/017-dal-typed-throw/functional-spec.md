# Functional Specification: DAL Typed-Throw Migration

- **Roadmap Item:** Audit-driven follow-up to the 2026-04-28 data-access-layer audit. Replace the three-layer `Result` wrapper machinery in the Data Access Layer (DAL) with typed exceptions caught at request edges. Captured as decision in `context/decisions/DAL_TYPED_THROW.md`.
- **Status:** Draft
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale

The DAL grew three different `Result` wrapper shapes (`RepositoryResult`, `ServiceResult`, `HandlerResult`) with different discriminators (`.ok` vs `.success`). The shape mismatch was a documented bug source — destructuring the wrong key silently returns `undefined`. A grep audit of consumers found that the wrapper machinery was earning its keep in only three places across the entire codebase; everywhere else it was pure ceremony. Services were also re-running Zod parses on input that had already been validated at the request edge (~18 duplicate parse blocks).

This change replaces the wrapper machinery with **typed exceptions** thrown by repositories and services and caught at the natural request boundaries (server actions, API route handlers, RSC pages). The rationale, design, alternatives considered, and full caller-branch evidence live in `context/decisions/DAL_TYPED_THROW.md` — that ADR is the source of truth. This spec captures the user-visible (read: contributor-visible) acceptance criteria and the migration scope.

The user-facing application is not changed by this work. The codebase becomes simpler, has one consistent error model, preserves stack traces end-to-end, and stops paying a translation tax on every layer transition. Future contributors read the happy path as straight `async/await` instead of decoding three different result shapes.

**Success measure:** all DAL `Result`-wrapper machinery is deleted (`RepositoryResult`, `ServiceResult`, `repositorySuccess/Error`, `serviceSuccess/Error`, `handleServiceError`, `BaseService`, `is*Result` helpers), every repository and service throws typed errors instead, the documented `.ok` vs `.success` trip-wire in `data-access-layer/CLAUDE.md` no longer applies, and CI (lint, typecheck, all test suites, integration tests) is green.

---

## 2. Functional Requirements

### User-facing

- **R1. No user-visible change to any feature.**
  - **Acceptance:**
    - [ ] Every existing user flow that previously succeeded still succeeds with no observable difference (sign in, browse library, add a game, journal entry, follow another user, browse profile, search IGDB, connect Steam, see imported games, etc.).
    - [ ] Every existing user flow that previously surfaced an error (validation failure, not-found, rate-limited, Steam private profile) still surfaces a recognisable error message in the same place. Wording may differ slightly because some error strings are now sourced from typed-error classes instead of hand-built result objects, but the meaning and the screen the error appears on do not change.
    - [ ] No new "something went wrong" screens, no white-screen crashes, no new toast or banner copy is introduced.

- **R2. Error messages remain at least as informative as today.**
  - **Acceptance:**
    - [ ] When a user triggers a validation failure (e.g. submits a form with an invalid value), the message they see explains the same problem as before.
    - [ ] When a user triggers a not-found condition (e.g. visits a profile that does not exist), the user sees the same kind of feedback as today (404 page, redirect, or empty state — whichever currently applies on that screen).
    - [ ] When the IGDB or Steam integrations are rate-limited or unavailable, the user-facing message communicates the same state as today (e.g. "Steam profile is private," "Search is temporarily unavailable, please try again").

### Observable contributor / project outcomes

- **R3. The three `Result` wrapper types are gone from the DAL.**
  - **Acceptance:**
    - [ ] `RepositoryResult`, `ServiceResult`, and their helpers (`repositorySuccess`, `repositoryError`, `serviceSuccess`, `serviceError`, `handleServiceError`, `isSuccessResult`, `isErrorResult`, `BaseService`, `RepositoryErrorCode`, `ServiceErrorCode`) no longer exist anywhere in `savepoint-app/data-access-layer/`.
    - [ ] No file in the codebase imports any of the above identifiers.
    - [ ] `ActionResult` (the server-action transport contract in `shared/lib/server-action/create-server-action.ts`) is preserved unchanged — that is intentional and out of scope.

- **R4. The DAL has one consistent error model.**
  - **Acceptance:**
    - [ ] Every repository function either returns the requested data (or `null` for "may miss" lookups, or `[]` for filtered queries, or a primitive for counts/aggregates) or throws a typed error from the agreed catalog.
    - [ ] Every service method either returns its data or throws a typed error from the agreed catalog. No service method returns a `Result`-shaped object.
    - [ ] No repository function silently returns a raw row in some cases and a wrapped result in others (the inconsistency flagged in the current `data-access-layer/CLAUDE.md` trip-wires section).

- **R5. The typed-error catalog is in place and split as agreed.**
  - **Acceptance:**
    - [ ] Generic errors (`DomainError` base, `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ExternalServiceError`, `RateLimitError`) live under `savepoint-app/shared/lib/errors/` and are importable from anywhere.
    - [ ] Domain-specific subclasses (`IgdbRateLimitError`, `SteamProfilePrivateError`) live next to the service that throws them.
    - [ ] All typed errors carry a structured `context` field for log enrichment.
    - [ ] Validation failures use `ZodError` directly — no wrapping class.

- **R6. Services trust typed input — no duplicate Zod parses.**
  - **Acceptance:**
    - [ ] No service method runs a Zod `safeParse` / `parse` on input that has already been validated at the request edge.
    - [ ] The ~18 duplicate validation blocks across `igdb-service`, `library-service`, `profile-service`, `social-service`, `steam-openid-service`, `igdb-matcher` are removed.

- **R7. Errors are logged exactly once per failure, at the request edge.**
  - **Acceptance:**
    - [ ] When a repository or service throws, the error is logged at the edge that catches it (server action, API route handler, or page error boundary) — not at every layer it passed through.
    - [ ] Log entries for thrown errors include the `context` field from the typed-error class so structured data is available without re-deriving it.
    - [ ] No typed-error class logs from its constructor.

- **R8. CI is green.**
  - **Acceptance:**
    - [ ] `pnpm --filter savepoint ci:check` passes on every PR in the migration sequence.
    - [ ] `pnpm --filter savepoint test:backend`, `test:components`, `test:utilities` all pass on every PR.
    - [ ] Repository integration tests (`pnpm test --project=integration`) pass on every PR.
    - [ ] No skipped or pending tests are introduced; tests that asserted on old `Result` shapes are migrated to assert typed throws.

- **R9. Migration lands as discrete, reviewable PRs.**
  - **Acceptance:**
    - [ ] PR 0 introduces the error catalog only, with no call-site changes.
    - [ ] PR 1 (pilot) converts the `platform` domain end-to-end (repository, service, any handlers, callers, tests) and validates the pattern.
    - [ ] Each subsequent PR converts exactly one domain: `genre`, `journal`, `library`, `game`, `activity-feed` / `social`, `profile`, `game-detail`, `onboarding`, `imported-game`, `steam`, `igdb`. Order may flex but must respect the "low-risk first" sequencing in the ADR.
    - [ ] The final "Reaper" PR deletes all `Result`-wrapper machinery (R3) and updates the affected `CLAUDE.md` files. After the Reaper PR merges, the trip-wires section of `data-access-layer/CLAUDE.md` no longer documents `.ok` vs `.success` confusion or raw-row inconsistencies.

- **R10. Documentation is updated alongside the Reaper PR.**
  - **Acceptance:**
    - [ ] `savepoint-app/data-access-layer/CLAUDE.md` is updated to describe the typed-throw model and remove the obsolete `Result` trip-wires.
    - [ ] `savepoint-app/data-access-layer/repository/CLAUDE.md` is updated to describe the new not-found contract (`T | null` for may-miss, `requireX` for must-exist, `T[]` for filtered, throw on modification of a missing entity).
    - [ ] `savepoint-app/data-access-layer/services/CLAUDE.md` and its `README.md` reflect the new "throw, do not wrap" service contract and the no-re-validation rule.
    - [ ] `context/decisions/DAL_TYPED_THROW.md` is referenced from the updated `data-access-layer/CLAUDE.md`.

---

## 3. Scope and Boundaries

### In-Scope

- Add a typed-error catalog under `shared/lib/errors/` plus per-service domain subclasses (`services/igdb/errors.ts`, `services/steam/errors.ts`).
- Convert every repository under `data-access-layer/repository/` to either return raw data (with `T | null`, `T[]`, primitives where appropriate) or throw a typed error. Repositories catch Prisma error codes (`P2002`, `P2025`) inline with operation-specific context and re-throw typed errors.
- Convert every service under `data-access-layer/services/` to either return its data or throw a typed error. Drop all `Result`-wrapper construction from service code.
- Update every API route handler under `data-access-layer/handlers/` to catch typed errors and return `HandlerResult` (the HTTP transport shape stays, but is now constructed from caught throws rather than from forwarded `ServiceResult` values).
- Update every server action that previously consumed `ServiceResult` to consume thrown errors. Most actions can now `await` services directly; `createServerAction`'s existing top-level `try/catch` becomes the operative catch site instead of being defensive.
- Update every RSC page that previously branched on `result.code` (e.g. `app/(protected)/profile/page.tsx`'s `NOT_FOUND` redirect) to catch the typed error instead.
- Update every use-case under `features/**/use-cases/` that previously branched on `ServiceErrorCode` (e.g. `import-game-to-library.ts`'s retry decision on `EXTERNAL_SERVICE_ERROR` / `IGDB_RATE_LIMITED`) to catch the typed error instead.
- Remove the ~18 duplicate Zod parse blocks inside services.
- Migrate every test that asserted `expect(result.success).toBe(...)` or `expect(result.ok).toBe(...)` to assert typed throws (`expect(...).rejects.toThrow(NotFoundError)`).
- Update `data-access-layer/CLAUDE.md`, `repository/CLAUDE.md`, `services/CLAUDE.md`, and `services/README.md` to describe the new model.
- Each domain conversion follows TDD: red (rewrite tests to expect throws), green (flip implementation), refactor (delete now-dead helpers and mocks scoped to that domain).

### Out-of-Scope

- The four-layer DAL split (handlers / services / repository / domain) is preserved — we are not collapsing layers in this work.
- Other deepening candidates surfaced by the audit are tracked separately and are NOT addressed here:
  - Collapsing thin services that are pure repository pass-throughs (e.g. `journal-service`, `platform-service`, etc.).
  - Deleting the `domain/imported-game` DTO that mirrors Prisma 1:1.
  - Lifting handler validation + rate-limit boilerplate into a shared `withHandler` middleware.
  - Auditing whether the `handlers/` transport is still earning its keep given that most reads/writes go through server actions now.
  - Lifting activity-feed mappers out of their service into a `mappers.ts` file.
- The `ActionResult` server-action transport shape (`shared/lib/server-action/create-server-action.ts`). It is the contract with the React client and stays as-is.
- The `HandlerResult` HTTP-response transport shape used by API route handlers. It stays — handlers now construct it from caught throws instead of forwarding a `ServiceResult`.
- Use-case orchestration patterns (`USE_CASE_PATTERN.md`). Use-cases continue to orchestrate multiple services; they now `await` and let typed errors propagate or catch the specific ones they handle.
- `next-safe-action`'s own validation behaviour. Server actions that use `authorizedActionClient` keep doing whatever they do today at the action edge.
- Any change to user-visible copy, screens, routing, or behaviour. This is a silent refactor.
- Per-Playthrough Logs, Game Detail Redesign, and any other in-flight roadmap items.
- Updating Linear / external issue tracker beyond what `/awos:linear` does on its own.
