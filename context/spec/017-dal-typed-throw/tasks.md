# Tasks: DAL Typed-Throw Migration

> Each slice leaves the app bootable and CI green. Run `pnpm --filter savepoint ci:check` after every slice. Each domain slice follows TDD red-green-refactor: rewrite tests to expect typed throws (red), flip repo + service + edge consumers (green), prune dead mocks/helpers (refactor).
>
> The user-facing app is unchanged across every slice. "Verify" steps confirm CI green + a smoke run of the affected feature.

## Slice 0 — Error catalog (additive, no call-site changes)

**Outcome:** Generic typed-error catalog lives under `shared/lib/errors/`. No DAL code imports it yet. CI green.

- [x] Create `shared/lib/errors/domain-error.ts` exporting an abstract `DomainError extends Error` with `(message: string, context?: Record<string, unknown>)` constructor; subclasses set `name`. **[Agent: nextjs-expert]**
- [x] Create `shared/lib/errors/{not-found-error,conflict-error,unauthorized-error,external-service-error,rate-limit-error}.ts`, each extending `DomainError` with `name` set; `RateLimitError` accepts optional `retryAfter` in `context`. **[Agent: nextjs-expert]**
- [x] Add `shared/lib/errors/index.ts` re-exporting the catalog. **[Agent: nextjs-expert]**
- [x] Add unit tests under `shared/lib/errors/__tests__/` covering: `instanceof DomainError` chain, `message` preservation, `name` correctness, `context` propagation. **[Agent: typescript-test-expert]** _(landed as `errors.unit.test.ts`, 35 tests, 124-test utilities suite green)_
- [x] **Verify:** lint, format, `test:utilities` green. Additivity grep returns zero hits. `typecheck` shows pre-existing failures in `test/fixtures/{library,journal,game-detail}.ts` (missing `platformId`/`playthroughId` from in-progress spec 016) — unrelated to this slice; tracked separately. **[Agent: typescript-test-expert]**

---

## Slice 1 — Pilot: `platform` domain (reference implementation)

**Outcome:** `platformRepository`, `PlatformService`, and the two platform handlers all use typed throws. `RepositoryResult`/`ServiceResult` machinery is still defined but no longer used by the platform vertical. Pattern is locked for the rest of the slices.

- [ ] **Red:** rewrite `data-access-layer/repository/platform/*.integration.test.ts` to assert returned values directly and to expect typed throws via `await expect(...).rejects.toThrow(NotFoundError)` where applicable. Tests fail. **[Agent: typescript-test-expert]**
- [ ] **Red:** rewrite `data-access-layer/services/platform/*.test.ts`: replace `mockResolvedValue(repositorySuccess(...))` with raw value, `mockResolvedValue(repositoryError(...))` with `mockRejectedValue(new NotFoundError(...))`; assert that service methods either return data or throw. Tests fail. **[Agent: typescript-test-expert]**
- [ ] **Red:** rewrite `data-access-layer/handlers/platform/*.test.ts` and `*.integration.test.ts` to assert HTTP-level outcomes only (status + body shape); internal mechanism changes but contract is invariant. **[Agent: typescript-test-expert]**
- [ ] **Green — repo:** convert `data-access-layer/repository/platform/platform-repository.ts`. Replace `repositorySuccess(data)` with `data`; signatures change to `Promise<T>` / `Promise<T | null>` / `Promise<T[]>`. No platform-specific Prisma error catches expected; if any, throw `NotFoundError` / `ConflictError` with operation-specific message. **[Agent: nextjs-expert]**
- [ ] **Green — service:** convert `data-access-layer/services/platform/platform-service.ts`. Drop `extends BaseService`. Each method returns its data directly or throws. Drop any `serviceSuccess`/`serviceError`/`handleServiceError`. **[Agent: nextjs-expert]**
- [ ] **Green — shared handler helper:** add `data-access-layer/handlers/map-error.ts` mapping `NotFoundError → 404`, `ConflictError → 409`, `UnauthorizedError → 401`, `RateLimitError → 429`, `ZodError → 400`, default → 500. Returns a `HandlerResult` failure. Used by both platform handlers in this slice. **[Agent: nextjs-expert]**
- [ ] **Green — handlers:** convert `data-access-layer/handlers/platform/{get-platforms-handler,get-unique-platforms-handler}.ts` to `try { ...await service... } catch (error) { return mapErrorToHandlerResult(error); }`. **[Agent: nextjs-expert]**
- [ ] **Green — server actions / RSC callers:** find every consumer of `PlatformService` or platform repo functions outside the DAL (`rg "PlatformService|platformRepository|getSystemPlatforms|savePlatforms|getPlatformsForGame" savepoint-app/{app,features}`); convert each from `if (!result.success)` to direct `await` (in `createServerAction`-wrapped actions) or `try/catch` (in RSC pages / use-cases). **[Agent: nextjs-expert]**
- [ ] **Refactor:** delete platform-specific test fixtures and mocks that constructed `RepositoryResult`/`ServiceResult` shapes. **[Agent: typescript-test-expert]**
- [ ] **Verify:** `pnpm --filter savepoint ci:check` green. Boot `pnpm --filter savepoint dev`, smoke-test any UI surface that lists platforms (game add/edit form's platform picker). No console errors. **[Agent: typescript-test-expert]**

---

## Slice 2 — `genre` domain

**Outcome:** `genreRepository` (no service today) returns raw data or throws. Direct callers updated.

- [ ] **Red:** rewrite `data-access-layer/repository/genre/*.integration.test.ts`. **[Agent: typescript-test-expert]**
- [ ] **Green:** convert `data-access-layer/repository/genre/genre-repository.ts` to throw / return raw. **[Agent: nextjs-expert]**
- [ ] **Green — callers:** `rg "genreRepository|findGenresBy" savepoint-app/{app,features,data-access-layer/services}`; update each. **[Agent: nextjs-expert]**
- [ ] **Verify:** `pnpm --filter savepoint ci:check` green; smoke any genre-rendering UI (game cards / detail page show genre badges). **[Agent: typescript-test-expert]**

---

## Slice 3 — `journal` domain

**Outcome:** `journalRepository` + `JournalService` use typed throws.

- [ ] **Red:** rewrite `data-access-layer/repository/journal/*.integration.test.ts` and `data-access-layer/services/journal/*.test.ts`. Pay attention to `P2025` cases at `journal-repository.ts:158,204` — their `repositoryError(NOT_FOUND, ...)` returns become `throw new NotFoundError(...)`. **[Agent: typescript-test-expert]**
- [ ] **Green — repo:** convert `journal-repository.ts`; preserve inline P2025 catches but throw `NotFoundError` with operation-specific message instead of returning `repositoryError`. **[Agent: nextjs-expert]**
- [ ] **Green — service:** convert `journal-service.ts` (171 LOC, 10 methods today, all wrappers around repo + `serviceSuccess`); each method returns data or throws. **[Agent: nextjs-expert]**
- [ ] **Green — callers:** `rg "JournalService|journalRepository" savepoint-app/{app,features}`; update each. **[Agent: nextjs-expert]**
- [ ] **Verify:** CI green; smoke journal entry create / edit / delete in the UI. **[Agent: typescript-test-expert]**

---

## Slice 4 — `library` domain

**Outcome:** `libraryRepository` + `LibraryService` use typed throws. Heavy slice — many callers, many tests.

- [ ] **Red:** rewrite `data-access-layer/repository/library/*.integration.test.ts` (note `P2002` catch at `library-repository.ts:49` becomes `throw new ConflictError(...)`) and `data-access-layer/services/library/*.test.ts`. Drop the `VALIDATION_ERROR` test path at `library-service.ts:345` — services no longer re-validate. **[Agent: typescript-test-expert]**
- [ ] **Green — repo:** convert `library-repository.ts`; inline P2002 catch throws `ConflictError`. **[Agent: nextjs-expert]**
- [ ] **Green — service:** convert `library-service.ts`. Delete duplicate Zod parse at the rating path. **[Agent: nextjs-expert]**
- [ ] **Green — handlers:** convert `data-access-layer/handlers/library/{get-library,get-status-counts}-handler.ts` using `mapErrorToHandlerResult`. **[Agent: nextjs-expert]**
- [ ] **Green — callers:** `rg "LibraryService|libraryRepository" savepoint-app/{app,features}` — exhaustive list; convert each. **[Agent: nextjs-expert]**
- [ ] **Refactor:** prune library-specific Result mocks. **[Agent: typescript-test-expert]**
- [ ] **Verify:** CI green; smoke library list / add game / change status / set rating / remove game. **[Agent: typescript-test-expert]**

---

## Slice 5 — `game` domain

**Outcome:** `gameRepository` + `GameService` (basic lookups) use typed throws.

- [ ] **Red:** rewrite `data-access-layer/repository/game/*.integration.test.ts` (P2002 catch at `game-repository.ts:114`). **[Agent: typescript-test-expert]**
- [ ] **Green — repo:** convert `game-repository.ts`; P2002 throws `ConflictError`. **[Agent: nextjs-expert]**
- [ ] **Green — service:** convert `game-detail-service.ts` and any `GameService`. **[Agent: nextjs-expert]**
- [ ] **Green — callers:** `rg "GameService|gameRepository|findGameById|upsertGame" savepoint-app/{app,features}`; update each. **[Agent: nextjs-expert]**
- [ ] **Verify:** CI green; smoke search → add game → game detail page. **[Agent: typescript-test-expert]**

---

## Slice 6 — `activity-feed` / `social`

**Outcome:** `activityFeedRepository`, `followRepository`, `ActivityFeedService`, `SocialService` use typed throws. Activity-feed mappers stay inline this slice (out-of-scope deepening).

- [ ] **Red:** rewrite repo + service tests for both domains. `follow-repository.ts:32` P2002 catch (already-following case) becomes `throw new ConflictError(...)`. **[Agent: typescript-test-expert]**
- [ ] **Green — repos:** convert `activity-feed-repository.ts`, `follow-repository.ts`. **[Agent: nextjs-expert]**
- [ ] **Green — services:** convert `activity-feed-service.ts:74-151` and `social-service.ts`. Drop duplicate Zod parses at `social-service.ts:46,66`. **[Agent: nextjs-expert]**
- [ ] **Green — handlers:** convert `data-access-layer/handlers/social/activity-feed-handler.ts`. **[Agent: nextjs-expert]**
- [ ] **Green — callers:** `rg "ActivityFeedService|SocialService|followRepository" savepoint-app/{app,features}`. **[Agent: nextjs-expert]**
- [ ] **Verify:** CI green; smoke follow user → see activity feed populated. **[Agent: typescript-test-expert]**

---

## Slice 7 — `profile`

**Outcome:** `userRepository` + `ProfileService` use typed throws. The known `app/(protected)/profile/page.tsx:27` `NOT_FOUND` redirect site is converted to `instanceof NotFoundError` catch.

- [ ] **Red:** rewrite `data-access-layer/repository/user/*.integration.test.ts` (4 P2025 sites + 1 P2002 site at `user-repository.ts:46,120,160,194,252,308`); rewrite `services/profile/*.test.ts`. Note: `updateUserProfile` historically returned a raw user row — its tests are normalized to the new typed-throw contract here. **[Agent: typescript-test-expert]**
- [ ] **Green — repo:** convert `user-repository.ts`; each P2025 throws `NotFoundError` with operation-specific message ("user not found while updating profile" etc.); P2002 at `:194` throws `ConflictError`. Normalize `updateUserProfile` and any other raw-row functions to the consistent contract. **[Agent: nextjs-expert]**
- [ ] **Green — service:** convert `profile-service.ts`; drop duplicate Zod parses at `:197,320`. **[Agent: nextjs-expert]**
- [ ] **Green — RSC page:** convert `app/(protected)/profile/page.tsx:27` from `if (result.code === ServiceErrorCode.NOT_FOUND) redirect(...)` to `try { ... } catch (error) { if (error instanceof NotFoundError) redirect(...); throw error; }`. **[Agent: nextjs-expert]**
- [ ] **Green — callers:** `rg "ProfileService|userRepository|getServerUserProfile|updateUserProfile" savepoint-app/{app,features}`. **[Agent: nextjs-expert]**
- [ ] **Verify:** CI green; smoke own profile page, public profile page (existing + nonexistent username — must still redirect / 404), profile edit. **[Agent: typescript-test-expert]**

---

## Slice 8 — `game-detail`

**Outcome:** `GameDetailService` aggregation uses typed throws. Depends on slices 4 (library), 5 (game) having landed (consumes both). May be reordered; if reordered, this slice's repos/services land here.

- [ ] **Red:** rewrite `services/game-detail/*.test.ts`. **[Agent: typescript-test-expert]**
- [ ] **Green — service:** convert `game-detail-service.ts` to `await` library + game services and let typed errors propagate. **[Agent: nextjs-expert]**
- [ ] **Green — callers:** `rg "GameDetailService" savepoint-app/{app,features}`. **[Agent: nextjs-expert]**
- [ ] **Verify:** CI green; smoke game detail page for a game in library, a game not in library, an invalid IGDB id (404 path). **[Agent: typescript-test-expert]**

---

## Slice 9 — `onboarding`

**Outcome:** `OnboardingService` (5-step calculation across 4 repos) uses typed throws. Pure function for progress calc may optionally be extracted (out-of-scope deepening; if not extracted now, leave note in code review).

- [ ] **Red:** rewrite `services/onboarding/*.test.ts`. **[Agent: typescript-test-expert]**
- [ ] **Green — service:** convert `onboarding-service.ts:60-142`. **[Agent: nextjs-expert]**
- [ ] **Green — callers:** `rg "OnboardingService" savepoint-app/{app,features}`. **[Agent: nextjs-expert]**
- [ ] **Verify:** CI green; sign up a fresh test user, walk the onboarding checklist end-to-end. **[Agent: typescript-test-expert]**

---

## Slice 10 — `imported-game`

**Outcome:** `importedGameRepository` + `ImportedGameService` use typed throws. P2025 catch at `imported-game-repository.ts:241` becomes `NotFoundError`. The `domain/imported-game` DTO is preserved (out-of-scope deepening).

- [ ] **Red:** rewrite repo + service tests. **[Agent: typescript-test-expert]**
- [ ] **Green — repo:** convert `imported-game-repository.ts`. **[Agent: nextjs-expert]**
- [ ] **Green — service:** convert `imported-game-service.ts`. **[Agent: nextjs-expert]**
- [ ] **Green — handlers:** convert `data-access-layer/handlers/steam-import/imported-games.handler.ts`. **[Agent: nextjs-expert]**
- [ ] **Green — callers:** `rg "ImportedGameService|importedGameRepository" savepoint-app/{app,features}`. **[Agent: nextjs-expert]**
- [ ] **Verify:** CI green; smoke `/steam/games` page (lists imported games or empty state). **[Agent: typescript-test-expert]**

---

## Slice 11 — `steam`

**Outcome:** `SteamService` and `SteamOpenIdService` throw typed errors. Domain-specific subclasses introduced here. Steam-import handlers and the connect/disconnect flow consume typed errors.

- [ ] **Catalog extension:** create `data-access-layer/services/steam/errors.ts` exporting `SteamProfilePrivateError extends ExternalServiceError` and `SteamApiUnavailableError extends ExternalServiceError`. Co-located unit tests. **[Agent: nextjs-expert]**
- [ ] **Red:** rewrite `services/steam/*.test.ts` and `services/steam/steam-openid-service.test.ts` to expect typed throws (private profile → `SteamProfilePrivateError`, API unavailable → `SteamApiUnavailableError`, validation → `ZodError`). **[Agent: typescript-test-expert]**
- [ ] **Green — service:** convert `steam-service.ts` and `steam-openid-service.ts`. Drop duplicate Zod parses at `steam-service.ts:245`, `steam-openid-service.ts:48,67,79`. **[Agent: nextjs-expert]**
- [ ] **Green — handlers:** convert `data-access-layer/handlers/steam-import/{steam-connect,fetch-steam-games}.handler.ts`; explicit override in their `catch` blocks: `SteamProfilePrivateError → 403`. **[Agent: nextjs-expert]**
- [ ] **Green — callers:** `rg "SteamService|SteamOpenIdService" savepoint-app/{app,features}`; update Steam connect button server actions, OpenID callback page. **[Agent: nextjs-expert]**
- [ ] **Verify:** CI green; smoke Steam connect (private profile → expect friendly error), Steam disconnect, current `triggerBackgroundSync` disabled-error path still surfaces. **[Agent: typescript-test-expert]**

---

## Slice 12 — `igdb`

**Outcome:** `IgdbService` and `IgdbMatcher` throw typed errors. `IgdbRateLimitError` introduced. `handlers/igdb/igdb-handler.ts:54-59` switch-on-code is replaced with `instanceof` mapping. Use-case retry decision at `import-game-to-library.ts:134-135` consumes typed errors.

- [ ] **Catalog extension:** create `data-access-layer/services/igdb/errors.ts` exporting `IgdbRateLimitError extends RateLimitError`. Co-located unit tests. **[Agent: nextjs-expert]**
- [ ] **Red:** rewrite `services/igdb/*.test.ts` and `services/igdb/igdb-matcher.test.ts`. Drop the seven `VALIDATION_ERROR` test paths (igdb-service input re-validation deletion). **[Agent: typescript-test-expert]**
- [ ] **Green — service:** convert `igdb-service.ts` (8 methods, ~7 duplicate Zod parses at `:156,203,242,304,389,428,488` — deleted), `igdb-matcher.ts:62`. Throw `IgdbRateLimitError` on rate-limit responses; `ExternalServiceError` on other API failures; `ZodError` on parsing IGDB response payloads. **[Agent: nextjs-expert]**
- [ ] **Green — handler:** convert `data-access-layer/handlers/igdb/igdb-handler.ts`; the `case ServiceErrorCode.X` switch becomes `instanceof` chain inside the catch block (`ZodError → 400`, `NotFoundError → 404`, `IgdbRateLimitError → 429`, `RateLimitError → 429`, default → 500). **[Agent: nextjs-expert]**
- [ ] **Green — use-case:** convert `features/steam-import/use-cases/import-game-to-library.ts:134-135` from `matchResult.code === EXTERNAL_SERVICE_ERROR || IGDB_RATE_LIMITED` to `error instanceof IgdbRateLimitError || error instanceof ExternalServiceError`. **[Agent: nextjs-expert]**
- [ ] **Green — callers:** `rg "IgdbService|igdbMatcher" savepoint-app/{app,features}`. **[Agent: nextjs-expert]**
- [ ] **Verify:** CI green; smoke IGDB game search via `/api/igdb/search` (valid query → results, invalid → 400, rate-limited → 429). **[Agent: typescript-test-expert]**

---

## Slice 13 — `auth`

**Outcome:** `AuthService` (sign-up/sign-in credentials path) throws typed errors. Last service to convert.

- [ ] **Red:** rewrite `services/auth/*.test.ts`. **[Agent: typescript-test-expert]**
- [ ] **Green — service:** convert `auth-service.ts`. **[Agent: nextjs-expert]**
- [ ] **Green — callers:** `rg "AuthService" savepoint-app/{app,features}`; update sign-up / sign-in server actions. **[Agent: nextjs-expert]**
- [ ] **Verify:** CI green; smoke sign-up (happy path + duplicate email → friendly error), sign-in (happy + bad password). **[Agent: typescript-test-expert]**

---

## Slice 14 — Reaper (cleanup)

**Outcome:** All `Result`-wrapper machinery deleted. CLAUDE.md docs updated. `rg` confirms no stragglers.

- [ ] **Pre-Reaper grep:** `rg "ServiceResult|RepositoryResult|serviceSuccess|serviceError|repositorySuccess|repositoryError|handleServiceError|BaseService|isSuccessResult|isErrorResult|RepositoryErrorCode|ServiceErrorCode" savepoint-app/{app,features,data-access-layer,shared}` should return matches **only** in `data-access-layer/{repository/errors.ts,services/types.ts,services/index.ts,repository/index.ts}` and tests being deleted in this slice. If anywhere else, that domain wasn't fully converted — file follow-up. **[Agent: nextjs-expert]**
- [ ] Delete `data-access-layer/repository/errors.ts`. **[Agent: nextjs-expert]**
- [ ] Edit `data-access-layer/services/types.ts`: remove `ServiceResult`, `ServiceErrorCode`, `serviceSuccess`, `serviceError`, `handleServiceError`, `isSuccessResult`, `isErrorResult`, `ExtractServiceData`. Keep `PaginatedResult`, `PaginationInput`, `CursorPaginatedResult`, `BaseServiceInput`. **[Agent: nextjs-expert]**
- [ ] Delete `data-access-layer/services/base-service.ts` (if it exists as its own file). **[Agent: nextjs-expert]**
- [ ] Update `data-access-layer/repository/index.ts` and `data-access-layer/services/index.ts`: drop re-exports of deleted symbols. **[Agent: nextjs-expert]**
- [ ] Update `data-access-layer/CLAUDE.md`: rewrite "Result Pattern" section as "Error Model" (typed throws + edge catches + link to ADR `context/decisions/DAL_TYPED_THROW.md`). Delete the two trip-wires "Result type shapes are NOT interchangeable" and "Some repository functions return plain rows, not RepositoryResult". Keep the other trip-wires. **[Agent: general-purpose]**
- [ ] Update `data-access-layer/repository/CLAUDE.md`: rewrite "Not-Found Handling" section to describe the type-driven contract (`findX → T | null` for may-miss, `requireX → T` throws for must-exist, list/filter → `T[]`, count → primitive, modification on missing entity → throws `NotFoundError`). **[Agent: general-purpose]**
- [ ] Update `data-access-layer/services/CLAUDE.md` and `data-access-layer/services/README.md`: replace "Result-based errors" / "extends BaseService" guidance with "throw typed errors" / "trust typed input — no re-validation." **[Agent: general-purpose]**
- [ ] Bump `Status:` from `Draft` → `In Review` in `context/spec/017-dal-typed-throw/{functional-spec.md,technical-considerations.md}`. **[Agent: general-purpose]**
- [ ] **Verify:** `pnpm --filter savepoint ci:check` green. `pnpm test --project=integration` green. Final canonical grep `rg "ServiceResult|RepositoryResult|serviceSuccess|serviceError|repositorySuccess|repositoryError|handleServiceError|BaseService|isSuccessResult|isErrorResult|RepositoryErrorCode|ServiceErrorCode" savepoint-app/{app,features,data-access-layer,shared} --glob '!*.test.ts'` returns **zero** hits. Smoke-boot the app, sign in, browse a few pages — no console errors. **[Agent: typescript-test-expert]**

---

### Required services (already present)

- `docker compose up -d` (Postgres + LocalStack) — required for repository integration tests on every slice. No new MCPs / services needed.

### Out-of-scope deepening candidates (tracked for later, not addressed here)

- Collapsing thin services that are pure repo pass-throughs.
- Deleting `domain/imported-game/imported-game.dto.ts` Prisma 1:1 mirror.
- Lifting handler validation + rate-limit boilerplate into a shared `withHandler` middleware.
- Auditing whether the `handlers/` transport is still earning its keep given server-action dominance.
- Lifting activity-feed mappers out of their service into a `mappers.ts` file.
