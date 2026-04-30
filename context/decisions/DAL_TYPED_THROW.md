# ADR: Typed-Throw in the Data Access Layer (replacing Result types)

**Status**: Accepted
**Date**: 2026-04-30
**Deciders**: Nail Badiullin
**Related**: [data-access-layer/CLAUDE.md](../../savepoint-app/data-access-layer/CLAUDE.md), [USE_CASE_PATTERN.md](./USE_CASE_PATTERN.md)

## Context

The DAL grew three different `Result` shapes that callers had to translate between:

| Type | Discriminator | Defined in |
|------|---------------|------------|
| `RepositoryResult<T>` | `.ok` | `repository/errors.ts` |
| `ServiceResult<T>` | `.success` | `services/types.ts` |
| `HandlerResult<T>` | `.success` | `handlers/types.ts` |

The shape mismatch was a documented trip-wire (silent `undefined` bugs from destructuring the wrong discriminator). Some repository functions returned `RepositoryResult`, others returned raw rows — callers had to read each function's return type before assuming a wrapper.

### Caller-branch evidence

A grep audit of consumers found:

- **`RepositoryErrorCode`**: zero non-repo branch sites. Repos build the wrapper, services immediately unwrap and rebuild as `ServiceResult` — pure translation tax.
- **`ServiceErrorCode`**: 3 real branch sites total — `handlers/igdb/igdb-handler.ts` (HTTP status mapping), `app/(protected)/profile/page.tsx` (`NOT_FOUND` redirect), `features/steam-import/use-cases/import-game-to-library.ts` (retry decision on `EXTERNAL_SERVICE_ERROR` / `IGDB_RATE_LIMITED`).
- **`VALIDATION_ERROR`**: ~18 sites, all services re-Zod-parsing input that was already Zod-parsed at the edge (`createServerAction`, handlers).

The Result machinery was paying for itself in three places. Everywhere else, it was ceremony.

## Decision

Replace the three `Result` types with **typed-throw**:

- Repositories throw on failure. Pure lookups return `T | null`. Filtered queries return `T[]` (empty is valid). Modifications on a missing identified entity throw `NotFoundError`.
- Services throw on failure. They trust typed input and do not re-validate.
- Edges (`createServerAction`, API route handlers, RSC pages) catch and serialize. `createServerAction`'s existing `try/catch` (`shared/lib/server-action/create-server-action.ts:53-62`) becomes the actual catch site instead of being defensive.
- The only `Result`-shaped survivor is `ActionResult` — the transport contract between server actions and client code, not a DAL concern.

### Typed error catalog

Generic in `shared/lib/errors/`, all extending a small `DomainError` base with structured `context`:

- `NotFoundError`
- `ConflictError`
- `UnauthorizedError`
- `ExternalServiceError`
- `RateLimitError`

Domain-specific subclasses co-located with their service:

- `services/igdb/errors.ts` → `IgdbRateLimitError extends RateLimitError`
- `services/steam/errors.ts` → `SteamProfilePrivateError extends ExternalServiceError`

Validation errors are `ZodError` directly — Zod already gives a typed, serializable shape; wrapping it adds nothing.

### Prisma error translation

Inline, operation-specific. Each repository function catches `P2002` / `P2025` at the call site and throws the typed error with a domain-meaningful message. No global `wrapPrisma` helper — generic translation produces useless messages and erases per-table semantics (a `P2002` in `createFollow` vs `createGame` is two different domain conditions).

### Logging

Edges log once. Errors carry a `context: Record<string, unknown>` bag so the edge log line has full structured data without re-deriving it. No log-on-construction inside error classes — that pattern produces duplicate stack traces in production.

## Rationale

### Why throw instead of unifying `Result`?

- Three real branch sites do not justify three layers of wrapper machinery affecting hundreds of call sites.
- `RepositoryErrorCode` had zero consumers — the entire layer was translation tax.
- Typed errors survive renames (TS catches `instanceof IgdbRateLimitError` mismatch; string-enum `code === "IGDB_RATE_LIMITED"` is silent).
- Stack traces are preserved.
- Happy path reads as straight code: `const game = await gameService.findById(id)`.
- Deletes `BaseService`, `serviceSuccess`, `serviceError`, `handleServiceError`, `repositorySuccess`, `repositoryError`, both `Result` types, both `is*Result` helpers, and ~18 duplicate Zod parses inside services.

### Why split the catalog?

Generic errors (`NotFoundError`, `ConflictError`) are reused outside the DAL — UI components, route guards, page error boundaries all care about "not found." Domain errors (`IgdbRateLimitError`) are meaningful only in the service that throws them. Co-location wins for locality; a global junk drawer of every error type loses it.

### Why services trust typed input?

`createServerAction` Zod-parses at the action edge. API route handlers Zod-parse. RSC pages parse URL params before calling services. Services receive `TypedInput`. A "what if a future caller bypasses the edge?" defensive parse is belt + suspenders + a third belt — TypeScript already enforces the contract at the call site.

### Why no global Prisma-error helper?

A blanket `P2025 → NotFoundError("not found")` produces useless messages — `NotFoundError` carries which entity, and that has to be supplied per-call anyway. `P2002` means different domain conditions per table (duplicate library item vs duplicate Steam connection vs duplicate follow). Inline catches are local: a reader of `createFollow` sees the `ConflictError` translation right there.

## Consequences

### Positive

- One mental model for DAL errors instead of three.
- Caller code reads as straight async/await on the happy path.
- Documented trip-wires in `data-access-layer/CLAUDE.md` (`.ok` vs `.success`, raw-row repos) become irrelevant — most of that section can be deleted in the final migration PR.
- Stack traces survive end-to-end.
- `instanceof` branching is rename-safe; string-enum branching was not.

### Negative

- Migration touches every repo, service, handler, and most consumers. Mitigated by the per-domain vertical-slice strategy below.
- Tests asserting `result.success` / `result.ok` need to become `expect(...).rejects.toThrow(NotFoundError)`. Mechanical but pervasive.
- Errors thrown from services that no longer pass through a Result wrapper can crash the process if a caller forgets to catch. Mitigation: `createServerAction` catches by default; API route handlers must each have a top-level `try/catch`; RSC pages either let Next's error boundary handle it or catch the specific case they care about.

### Neutral

- `ActionResult` survives at the action transport boundary. This is intentional: the contract with the client is serializable and shape-stable, which a thrown `Error` is not.

## Migration

Vertical slice per domain, TDD red-green-refactor.

1. **PR 0 — Catalog.** Add `shared/lib/errors/` with `DomainError` base and the generic five. No call-site changes.
2. **PR 1 — Pilot: `platform`.** Smallest domain. Convert repo, service, handlers, callers, tests. Validates the pattern end-to-end.
3. **PRs 2-N — One domain per PR**, in order of risk: `genre`, `journal`, `library`, `game`, `activity-feed`/`social`, `profile`, `game-detail`, `onboarding`, `imported-game`, `steam`, `igdb`. The last two have the most external-API failure modes and the only real `ServiceErrorCode` branch sites — they benefit from the catalog being battle-tested.
4. **Final PR — Reaper.** Delete `RepositoryResult`, `repositorySuccess`, `repositoryError`, `ServiceResult`, `ServiceErrorCode`, `serviceSuccess`, `serviceError`, `handleServiceError`, `BaseService`, `isSuccessResult`, `isErrorResult`. Update `data-access-layer/CLAUDE.md` and `repository/CLAUDE.md` trip-wires.

Tests before code each slice: rewrite assertions to expect typed throws (red), flip implementation (green), prune dead mocks and pass-through helpers (refactor).

## Notes

- ADR [USE_CASE_PATTERN.md](./USE_CASE_PATTERN.md) is unaffected. Use-cases still orchestrate multiple services; they now `await` and let typed errors propagate (or catch the specific ones they handle, like `IgdbRateLimitError` in `import-game-to-library.ts`).
- This decision does not relitigate the four-layer split (handlers/services/repository/domain). Other shallow-layer concerns surfaced during the audit (thin wrapper services, the `imported-game` DTO, handler validation/rate-limit boilerplate, raw-row vs wrapped repo inconsistency) are tracked separately and may warrant follow-up ADRs.
