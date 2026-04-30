# Technical Specification: DAL Typed-Throw Migration

- **Functional Specification:** [`functional-spec.md`](./functional-spec.md)
- **Decision Record:** [`context/decisions/DAL_TYPED_THROW.md`](../../decisions/DAL_TYPED_THROW.md)
- **Status:** Draft
- **Author(s):** Nail Badiullin

---

## 1. High-Level Technical Approach

Replace the three DAL `Result` wrapper types (`RepositoryResult`, `ServiceResult`, plus `HandlerResult`'s upstream feed) with **typed exceptions** thrown by repositories and services and caught at the natural request boundaries. Done as a sequence of vertical slices (one PR per domain), preceded by an additive catalog PR and followed by a "Reaper" cleanup PR.

The migration touches every file under `savepoint-app/data-access-layer/` plus call sites in `savepoint-app/{app,features,shared}/`. No production behavior change is intended — the user-facing application is unaffected. `ActionResult` (server-action transport) and `HandlerResult` (HTTP response shape) are preserved; they are now constructed from caught throws inside the edges that own them, not forwarded from the DAL.

The ADR is the source of truth for the "why," the catalog choice (Medium / Split), the not-found contract, the no-re-validation rule, the inline Prisma translation rule, and the edge-only logging rule. This tech spec is the "how": file layout, per-domain conversion recipe, test migration recipe, and the Reaper checklist.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Error catalog (PR 0 — additive, no call-site changes)

**New files under `savepoint-app/shared/lib/errors/`:**

| Path | Responsibility |
|---|---|
| `shared/lib/errors/domain-error.ts` | Abstract `DomainError` base extending `Error`. Constructor accepts `(message: string, context?: Record<string, unknown>)`. Exposes `name` (subclass overrides) and `context`. No logging in constructor. |
| `shared/lib/errors/not-found-error.ts` | `NotFoundError extends DomainError`. Used when an identified entity required for an operation does not exist. |
| `shared/lib/errors/conflict-error.ts` | `ConflictError extends DomainError`. Used for unique-constraint violations and similar "already exists / conflicting state" cases. |
| `shared/lib/errors/unauthorized-error.ts` | `UnauthorizedError extends DomainError`. Used when authenticated user is not permitted to act on a resource. |
| `shared/lib/errors/external-service-error.ts` | `ExternalServiceError extends DomainError`. Base for failures originating in third-party APIs (IGDB, Steam Web API, Steam OpenID, etc.). |
| `shared/lib/errors/rate-limit-error.ts` | `RateLimitError extends DomainError`. Optional `retryAfter` in `context`. |
| `shared/lib/errors/index.ts` | Re-export all of the above. |

**Test scaffolding under `savepoint-app/shared/lib/errors/__tests__/`:** unit tests asserting that each subclass is `instanceof DomainError`, preserves `message`, exposes `name` correctly, surfaces `context`. Vitest, utilities project.

**Domain-specific subclasses are NOT added in PR 0.** They land in their respective domain slices:

| Path | Class | Lands in slice |
|---|---|---|
| `data-access-layer/services/igdb/errors.ts` | `IgdbRateLimitError extends RateLimitError` | igdb slice |
| `data-access-layer/services/steam/errors.ts` | `SteamProfilePrivateError extends ExternalServiceError`; `SteamApiUnavailableError extends ExternalServiceError` | steam slice |

**No imports change anywhere else in PR 0.** This PR is reviewable as pure additions plus new tests.

### 2.2 Per-domain slice recipe (PRs 1 through N)

Each domain slice converts one vertical (repo + service + every consumer of that service) in a single PR. The pattern is identical for every slice; the pilot (PR 1, `platform`) doubles as the reference implementation.

**Slice order** (low risk → high risk; informed by ADR + grep audit):

1. `platform` (pilot — smallest; thin service, single repo, two handlers).
2. `genre` (no service today — repo only; trivial migration of any direct callers).
3. `journal` (single repo, single service, no external APIs, several callers).
4. `library` (heavy repo, many callers, no external APIs).
5. `game` (basic lookups; widely consumed).
6. `activity-feed` / `social` (paired — service + mappers + use-case-style aggregation).
7. `profile` (consumes library + user repos; one RSC `NOT_FOUND` branch in `app/(protected)/profile/page.tsx`).
8. `game-detail` (read-side aggregation across IGDB + library + journal; note this consumes the `igdb` service so depends on igdb slice having landed — alternatively stub the IGDB call for this slice and revisit when igdb lands).
9. `onboarding` (5-step calculation across 4 repos; mostly internal).
10. `imported-game` (steam-import consumer).
11. `steam` (external API; introduces `SteamProfilePrivateError`, `SteamApiUnavailableError`, `RateLimitError`).
12. `igdb` (external API; introduces `IgdbRateLimitError`; finishes consumer-side branching at `handlers/igdb/igdb-handler.ts:54-59` and `features/steam-import/use-cases/import-game-to-library.ts:134-135`).

**Per-slice steps (TDD red-green-refactor):**

| Step | What happens |
|---|---|
| **Red — repository tests** | Rewrite `repository/<domain>/*.integration.test.ts` assertions: `expect(result.ok).toBe(true)` → assert returned value directly; `expect(result.ok).toBe(false); expect(result.error.code).toBe(...)` → `await expect(fn()).rejects.toThrow(NotFoundError)`. Tests fail. |
| **Red — service tests** | Same transformation in `services/<domain>/*.test.ts`. Replace `mockRepo.X.mockResolvedValue(repositorySuccess(row))` with `mockRepo.X.mockResolvedValue(row)`. Replace `mockRepo.X.mockResolvedValue(repositoryError(NOT_FOUND, ...))` with `mockRepo.X.mockRejectedValue(new NotFoundError(...))`. Tests fail. |
| **Green — repository** | Convert each function in `repository/<domain>/<domain>-repository.ts`: replace `repositorySuccess(data)` with `data`; replace `repositoryError(NOT_FOUND, ...)` with `throw new NotFoundError(...)`; replace `repositoryError(DUPLICATE, ...)` with `throw new ConflictError(...)`. Inline Prisma `try/catch` for `P2002` / `P2025` stays inline; the `repositoryError(...)` return becomes a `throw new ConflictError(...)` / `throw new NotFoundError(...)` with operation-specific message. Function signatures change: `Promise<RepositoryResult<T>>` → `Promise<T>`, `Promise<RepositoryResult<T \| null>>` → `Promise<T \| null>`, `Promise<RepositoryResult<T[]>>` → `Promise<T[]>`. Where the existing repo function is "must exist" (modification on identified entity), throw `NotFoundError` and return `Promise<T>`; where it is "may miss" (pure lookup), return `Promise<T \| null>`. Add a `requireX` variant if and only if a caller in this slice needs the must-exist semantics for what was previously a `findX`. Functions that already returned raw rows (e.g. `updateUserProfile`) are normalized to the new contract here. |
| **Green — service** | Drop `extends BaseService`. Drop all `serviceSuccess`/`serviceError`/`handleServiceError` calls. Each method's return type changes from `Promise<ServiceResult<T>>` to `Promise<T>` (or `Promise<T \| null>`). Domain-specific throws: `IgdbRateLimitError`, `SteamProfilePrivateError`, etc., are added in their own slice with co-located `errors.ts`. Delete duplicate Zod parses (R6) — services trust typed input. The single allowed exception is when the service receives `unknown` / external-API JSON; that data is parsed once at the API boundary inside the service (e.g. `IgdbService` parsing IGDB responses), and a parse failure throws `ZodError`. |
| **Green — edge consumers** | Update every consumer of the converted service. Recipe per consumer type below. |
| **Refactor** | Delete now-unused mocks, helpers, fixtures scoped to this slice. Run `pnpm --filter savepoint ci:check`. |

**Consumer update recipes:**

| Consumer | Before | After |
|---|---|---|
| **API route handler** (`data-access-layer/handlers/<domain>/*.ts`) | `const result = await service.x(); if (!result.success) return { success: false, error: result.error, status: mapCodeToStatus(result.code) }; return { success: true, data: result.data, status: 200 };` | `try { const data = await service.x(); return { success: true, data, status: 200 }; } catch (error) { return mapErrorToHandlerResult(error); }` where `mapErrorToHandlerResult` is a small per-handler helper or, if the mapping is identical across handlers (it largely is — `NotFoundError` → 404, `ConflictError` → 409, `UnauthorizedError` → 401, `RateLimitError` → 429, `ZodError` → 400, else → 500), a shared helper at `data-access-layer/handlers/map-error.ts`. **Decision: introduce that shared helper in the pilot slice** — but only if at least two handlers in the slice would consume it. For `platform` that means yes (two handlers). Domain-specific status overrides (e.g. `SteamProfilePrivateError` → 403) live in the calling handler's `catch`. |
| **Server action** (`features/<feat>/server-actions/*.ts`) | `const result = await service.x(); if (!result.success) return { success: false, error: result.error }; return { success: true, data: result.data };` | `const data = await service.x(); return { success: true, data };`. The throw bubbles to `createServerAction`'s outer `try/catch` (`shared/lib/server-action/create-server-action.ts:53-62`), which logs and serialises `error.message` into `ActionResult.error`. |
| **RSC page** (e.g. `app/(protected)/profile/page.tsx:27`) | `if (result.code === ServiceErrorCode.NOT_FOUND) redirect(...)` | `try { const data = await service.x(); ... } catch (error) { if (error instanceof NotFoundError) redirect(...); throw error; }` |
| **Use-case** (e.g. `features/steam-import/use-cases/import-game-to-library.ts:134-135`) | `const matchResult = await igdb.match(...); if (!matchResult.success) { const isExternal = matchResult.code === EXTERNAL_SERVICE_ERROR \|\| matchResult.code === IGDB_RATE_LIMITED; if (isExternal) ... }` | `try { const match = await igdb.match(...); ... } catch (error) { if (error instanceof IgdbRateLimitError \|\| error instanceof ExternalServiceError) { /* retry path */ } else { throw error; } }` |

**`createServerAction` itself is unchanged in this migration.** Its existing top-level `try/catch` catches the new throws and serializes them into `ActionResult` exactly as it does today for unexpected errors. The only optional improvement (out-of-scope for this spec) would be teaching it to surface a richer error code when the caught error is a `DomainError` — that is a follow-up.

### 2.3 Reaper PR (final)

After all domain slices have landed, a single cleanup PR:

| Path | Action |
|---|---|
| `data-access-layer/repository/errors.ts` | **Delete file.** All consumers now import typed errors from `shared/lib/errors` or co-located `errors.ts`. |
| `data-access-layer/services/types.ts` | Remove `ServiceResult`, `ServiceErrorCode`, `serviceSuccess`, `serviceError`, `handleServiceError`, `isSuccessResult`, `isErrorResult`, `ExtractServiceData`. Keep `PaginatedResult`, `PaginationInput`, `CursorPaginatedResult`, `BaseServiceInput` (these are non-error pagination types and have value). |
| `data-access-layer/services/base-service.ts` (if exists) | **Delete.** No service extends it after the slices land. |
| `data-access-layer/repository/index.ts`, `data-access-layer/services/index.ts` | Drop re-exports of deleted symbols. |
| `data-access-layer/CLAUDE.md` | Rewrite "Result Pattern" section as "Error Model": typed throws, edge catches, link to ADR. Delete "Result type shapes are NOT interchangeable" trip-wire. Delete "Some repository functions return plain rows, not RepositoryResult" trip-wire (now uniform). Keep "Service-to-service calls are forbidden," "Handlers must skip the repository," "Server actions skip handlers," "Logging context is mandatory." |
| `data-access-layer/repository/CLAUDE.md` | Rewrite "Not-Found Handling" section: `findX` → `T \| null`, `requireX` → throws `NotFoundError`, list/filter → `T[]`, count/aggregate → primitive, modification on missing entity → throws `NotFoundError`. |
| `data-access-layer/services/CLAUDE.md`, `data-access-layer/services/README.md` | Replace "Result-based errors" / "Services extend BaseService and return ServiceResult" with "Services throw typed errors. Services trust typed input — no re-validation." |
| Audit grep | `rg "ServiceResult\|RepositoryResult\|serviceSuccess\|serviceError\|repositorySuccess\|repositoryError\|handleServiceError\|BaseService\|isSuccessResult\|isErrorResult"` returns zero matches outside of git history. |

The Reaper PR contains no behavior change. It is the bookkeeping commit that closes the migration.

### 2.4 Files NOT changed by this work

- `shared/lib/server-action/create-server-action.ts` — `ActionResult` and the wrapper's existing try/catch are preserved.
- `shared/lib/safe-action/*` (next-safe-action setup) — its action-result shape is the same as `ActionResult`; no change needed.
- `data-access-layer/handlers/types.ts` — `HandlerResult` (HTTP transport shape) is preserved; only how it gets constructed inside handlers changes.
- `data-access-layer/domain/imported-game/*` — the DTO mapper question is a separate audit candidate, out of scope.
- All `features/<feat>/use-cases/*` orchestration semantics — use-cases continue to compose multiple services. Only error-handling syntax changes.

---

## 3. Impact and Risk Analysis

### System Dependencies

- **Every `data-access-layer/services/*`** is consumed by at least one of: API route handler, server action, RSC page, use-case. Each slice's "edge consumer update" step has to find every caller. Mitigation: ESLint forbids importing repositories outside services and importing handlers outside `app/api/`, so the caller search is bounded — `rg "from \"@/data-access-layer/services/<domain>\""` plus `rg "<ServiceName>"` is sufficient.
- **Tests across all four projects** (backend, components, utilities, integration) reference `Result` shapes. Each slice must update its own domain's tests; the Reaper PR catches any stragglers via `pnpm typecheck` failing on deleted symbols.
- **Prisma error code mapping** is currently inline at 8 sites across 6 repository files. Each slice owns the inline `try/catch` for its domain — none of these are shared.

### Potential Risks & Mitigations

| Risk | Mitigation |
|---|---|
| A caller forgets to `try/catch`, error escapes to a place that previously got a Result, user sees a 500 / blank page where they previously got a friendly error | `createServerAction`'s top-level `try/catch` already serialises any throw to `ActionResult`. API route handlers must each have a top-level `try/catch` (enforced by the per-slice review checklist; the optional shared `mapErrorToHandlerResult` helper standardises it). RSC pages that previously branched on `result.code` must catch — list of three known sites is in the ADR; each is hit explicitly during its slice. |
| Stack traces from typed errors leak through `error.message` to user-visible toasts | `createServerAction` and handlers serialise only `error.message`, not stack. Existing logger writes the stack to logs (server-side). No new exposure. |
| A repo function changing return type breaks an unrelated caller in another package | `pnpm typecheck` on every PR catches this. Each slice's PR runs full CI. |
| Domain-specific errors (`IgdbRateLimitError`, `SteamProfilePrivateError`) thrown but not caught by a use-case that needed to retry | Two known retry sites: `import-game-to-library.ts:134-135` (igdb codes) and any future steam retry. Slice-by-slice approach hits these explicitly; `instanceof` checks at those sites replace `code ===` checks. |
| Migration takes too long, codebase sits in mixed state for extended period | Slice order is engineered so the codebase is never broken between PRs — both `Result`-based services and throwing services can coexist because they are independent vertical slices. CI is green at every step. The Reaper PR can land any time after the last domain slice; if work pauses for weeks, only the Reaper is delayed. |
| Tests over-mock the typed-error catalog (mocking `NotFoundError` itself) | Code review; typed errors are simple classes, no need to mock. Each slice's TDD step rewrites mocks to throw a real instance. |
| A repo function that today silently returns `repositorySuccess(null)` for "may miss" gets accidentally converted to throw | Per-slice rule: read each function's intent (its callers tell you), then pick `T \| null` (lookup that may miss) vs `requireX` (must exist) vs throw on modification of missing target. The pilot PR's review establishes the convention. |
| Shared helper `mapErrorToHandlerResult` becomes a god-helper that every handler imports and then each handler also overrides | Helper is a tiny `instanceof` switch with sensible defaults; handlers override only when they need a non-default status (e.g. Steam → 403). Code review for any growth beyond the catalog. |

### Performance / observability impact

None expected. Throwing has the same allocation cost as constructing a `Result` object at the failure site. Edge logging produces one log line per failure, same as today's `handleServiceError`. Stack traces are now end-to-end (improvement).

---

## 4. Testing Strategy

### Unit tests (per slice)

- **Repository unit tests do not exist today** — repos use integration tests against real Postgres. Repository integration tests under `repository/<domain>/*.integration.test.ts` are rewritten in each slice's red step to assert returned values directly and to assert typed throws via `await expect(...).rejects.toThrow(NotFoundError)` etc. Existing `database-constraints.integration.test.ts` (currently asserting `RepositoryResult`) is rewritten to assert typed throws.
- **Service unit tests** under `services/<domain>/*.test.ts` are rewritten to mock repositories with raw return values + rejected promises, and to assert that each service method throws the expected typed error. `instanceof` matchers preferred over `name` string matching.

### Integration tests

- API route handlers' integration tests under `handlers/<domain>/*.integration.test.ts` continue to assert HTTP-level outcomes (status, body shape). The internal mechanism changes (handler now catches instead of forwarding `ServiceResult`) but the tested contract — HTTP status + JSON body — is invariant.
- Repository integration tests run under `pnpm test --project=integration`; required to be green per slice.

### Edge / smoke

- `createServerAction.test.ts` already exists at `shared/lib/server-action/`; its existing test cases cover the catch path. No new test needed unless we change the wrapper itself.
- A new shared test for `shared/lib/errors/` covers `DomainError` base, `instanceof` chain, `context` propagation.

### CI gate per PR

`pnpm --filter savepoint ci:check` (lint + format + typecheck + all four test projects). Migration validation workflow (`pr-checks.yml`) runs unchanged — no DB schema changes.

### TDD rhythm reminder per slice

| Phase | Outcome |
|---|---|
| Red | Tests fail because production code still returns `Result` shapes. |
| Green | Tests pass after repo + service flip + edge-consumer updates within the slice. |
| Refactor | Dead mocks, fixtures, helpers scoped to the slice are deleted. CI remains green. |

The Reaper PR has no red phase — it deletes symbols whose only remaining references are the Reaper's own delete edits. CI must be green pre- and post-Reaper.
