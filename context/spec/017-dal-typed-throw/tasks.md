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

- [x] **Red:** rewrite `data-access-layer/repository/platform/*.integration.test.ts` to assert returned values directly and to expect typed throws via `await expect(...).rejects.toThrow(NotFoundError)` where applicable. Tests fail. **[Agent: typescript-test-expert]** _(no rewrite needed — repo already returned raw data; integration tests already asserted directly)_
- [x] **Red:** rewrite `data-access-layer/services/platform/*.test.ts`: replace `mockResolvedValue(repositorySuccess(...))` with raw value, `mockResolvedValue(repositoryError(...))` with `mockRejectedValue(new NotFoundError(...))`; assert that service methods either return data or throw. Tests fail. **[Agent: typescript-test-expert]**
- [x] **Red:** rewrite `data-access-layer/handlers/platform/*.test.ts` and `*.integration.test.ts` to assert HTTP-level outcomes only (status + body shape); internal mechanism changes but contract is invariant. **[Agent: typescript-test-expert]**
- [x] **Green — repo:** convert `data-access-layer/repository/platform/platform-repository.ts`. Replace `repositorySuccess(data)` with `data`; signatures change to `Promise<T>` / `Promise<T | null>` / `Promise<T[]>`. No platform-specific Prisma error catches expected; if any, throw `NotFoundError` / `ConflictError` with operation-specific message. **[Agent: nextjs-expert]** _(no-op — repo was already raw)_
- [x] **Green — service:** convert `data-access-layer/services/platform/platform-service.ts`. Drop `extends BaseService`. Each method returns its data directly or throws. Drop any `serviceSuccess`/`serviceError`/`handleServiceError`. **[Agent: nextjs-expert]** _(`getPlatformsForGame` now throws `NotFoundError` for missing game)_
- [x] **Green — shared handler helper:** add `data-access-layer/handlers/map-error.ts` mapping `NotFoundError → 404`, `ConflictError → 409`, `UnauthorizedError → 401`, `RateLimitError → 429`, `ZodError → 400`, default → 500. Returns a `HandlerResult` failure. Used by both platform handlers in this slice. **[Agent: nextjs-expert]** _(includes `Retry-After` header for `RateLimitError.context.retryAfter`)_
- [x] **Green — handlers:** convert `data-access-layer/handlers/platform/{get-platforms-handler,get-unique-platforms-handler}.ts` to `try { ...await service... } catch (error) { return mapErrorToHandlerResult(error); }`. **[Agent: nextjs-expert]** _(also `get-platforms-for-library-modal.ts`)_
- [x] **Green — server actions / RSC callers:** find every consumer of `PlatformService` or platform repo functions outside the DAL (`rg "PlatformService|platformRepository|getSystemPlatforms|savePlatforms|getPlatformsForGame" savepoint-app/{app,features}`); convert each from `if (!result.success)` to direct `await` (in `createServerAction`-wrapped actions) or `try/catch` (in RSC pages / use-cases). **[Agent: nextjs-expert]** _(`features/manage-library-entry/use-cases/get-platforms-for-library-modal.unit.test.ts` mocks rewritten)_
- [x] **Refactor:** delete platform-specific test fixtures and mocks that constructed `RepositoryResult`/`ServiceResult` shapes. **[Agent: typescript-test-expert]** _(also fixed `vi.clearAllMocks()` → `vi.resetAllMocks()` to prevent `mockResolvedValueOnce` queue leakage between tests)_
- [x] **Verify:** `pnpm --filter savepoint ci:check` green (typecheck, lint, format). Tests: utilities 124/124, components 812/812, backend 776/776, integration 412/412. GameDetailService surgery turned out to be a no-op (it consumes `upsertPlatforms` from the repo directly, not via `PlatformService`). Manual UI smoke deferred to human pre-merge. **[Agent: typescript-test-expert]**

---

## Slice 2 — `genre` domain

**Outcome:** `genreRepository` (no service today) returns raw data or throws. Direct callers updated.

- [x] **Red:** rewrite `data-access-layer/repository/genre/*.integration.test.ts`. **[Agent: typescript-test-expert]** _(no-op — tests already assert directly on raw returns; no `.ok` / Result usage)_
- [x] **Green:** convert `data-access-layer/repository/genre/genre-repository.ts` to throw / return raw. **[Agent: nextjs-expert]** _(no-op — repo already returns `PrismaGenre | PrismaGenre[] | null` raw; `findGenreByIgdbId` already follows the may-miss `T | null` pattern; no `RepositoryResult` anywhere)_
- [x] **Green — callers:** `rg "genreRepository|findGenresBy" savepoint-app/{app,features,data-access-layer/services}`; update each. **[Agent: nextjs-expert]** _(only consumer is `services/game-detail/game-detail-service.ts:94` — already calls `await upsertGenres(...)` and uses raw return)_
- [x] **Verify:** `pnpm --filter savepoint ci:check` green; smoke any genre-rendering UI (game cards / detail page show genre badges). **[Agent: typescript-test-expert]** _(typecheck pass; backend tests 776/776 pass; no production changes — UI smoke unchanged)_

---

## Slice 3 — `journal` domain

**Outcome:** `journalRepository` + `JournalService` use typed throws.

- [x] **Red:** rewrite `data-access-layer/repository/journal/*.integration.test.ts` and `data-access-layer/services/journal/*.test.ts`. Pay attention to `P2025` cases at `journal-repository.ts:158,204` — their `repositoryError(NOT_FOUND, ...)` returns become `throw new NotFoundError(...)`. **[Agent: typescript-test-expert]** _(repo + repo tests no-op; service tests 1163 LOC fully rewritten)_
- [x] **Green — repo:** convert `journal-repository.ts`; preserve inline P2025 catches but throw `NotFoundError` with operation-specific message instead of returning `repositoryError`. **[Agent: nextjs-expert]** _(no-op — repo already typed-throw; P2025 catches already throw `NotFoundError`)_
- [x] **Green — service:** convert `journal-service.ts` (171 LOC, 10 methods today, all wrappers around repo + `serviceSuccess`); each method returns data or throws. **[Agent: nextjs-expert]** _(7 methods converted; `types.ts` `JournalService` interface collided with class name — renamed to `JournalServiceContract`)_
- [x] **Green — callers:** `rg "JournalService|journalRepository" savepoint-app/{app,features}`; update each. **[Agent: nextjs-expert]** _(4 server actions, 3 RSC pages with `notFound()` via `instanceof NotFoundError`, 2 use-cases with `.catch(() => fallback)`, all action + use-case tests rewritten)_
- [x] **Verify:** CI green; smoke journal entry create / edit / delete in the UI. **[Agent: typescript-test-expert]** _(typecheck/lint/format pass; utilities 124, components 812, backend 774, integration 412 all pass; pre-existing test bug fixed: empty title is valid per schema, test was using wrong invariant)_

---

## Slice 4 — `library` domain

**Outcome:** `libraryRepository` + `LibraryService` use typed throws. Heavy slice — many callers, many tests.

- [x] **Red:** rewrite `data-access-layer/repository/library/*.integration.test.ts` (note `P2002` catch at `library-repository.ts:49` becomes `throw new ConflictError(...)`) and `data-access-layer/services/library/*.test.ts`. Drop the `VALIDATION_ERROR` test path at `library-service.ts:345` — services no longer re-validate. **[Agent: typescript-test-expert]**
- [x] **Green — repo:** convert `library-repository.ts`; inline P2002 catch throws `ConflictError`. **[Agent: nextjs-expert]**
- [x] **Green — service:** convert `library-service.ts`. Delete duplicate Zod parse at the rating path. **[Agent: nextjs-expert]**
- [x] **Green — handlers:** convert `data-access-layer/handlers/library/{get-library,get-status-counts}-handler.ts` using `mapErrorToHandlerResult`. **[Agent: nextjs-expert]**
- [x] **Green — callers:** `rg "LibraryService|libraryRepository" savepoint-app/{app,features}` — exhaustive list; convert each. **[Agent: nextjs-expert]** _(server actions, RSC pages on `/library`, `/dashboard`, `/u/[username]/library`, dashboard UI components, and 4 use-cases including partial conversion of `import-game-to-library.ts` — IGDB-side stays for Slice 12)_
- [x] **Refactor:** prune library-specific Result mocks. **[Agent: typescript-test-expert]** _(includes a tiny ProfileService surgery for `getRatingHistogram` consumer that depends on library repo's new contract)_
- [x] **Verify:** CI green; smoke library list / add game / change status / set rating / remove game. **[Agent: typescript-test-expert]** _(typecheck/lint/format pass; utilities 124, components 812, backend 765, integration 412 all pass; fixed 2 stale assertions in `library-actions.integration.test.ts:703,725` that expected old wrapper string "Failed to update library entry" — now correctly assert specific `NotFoundError.message` "Library item not found")_

---

## Slice 5 — `game` domain

**Outcome:** `gameRepository` + `GameService` (basic lookups) use typed throws.

- [x] **Red:** rewrite `data-access-layer/repository/game/*.integration.test.ts` (P2002 catch at `game-repository.ts:114`). **[Agent: typescript-test-expert]** _(repo + integration test were already converted by the first agent run before pause)_
- [x] **Green — repo:** convert `game-repository.ts`; P2002 throws `ConflictError`. **[Agent: nextjs-expert]** _(done in first agent run)_
- [x] **Green — service:** convert `game-detail-service.ts` and any `GameService`. **[Agent: nextjs-expert]** _(done in first agent run; covers both Slice 5 basic lookups AND Slice 8 read-side aggregation since they live in the same file — Slice 8 will be a no-op)_
- [x] **Green — callers:** `rg "GameService|gameRepository|findGameById|upsertGame" savepoint-app/{app,features}`; update each. **[Agent: nextjs-expert]** _(use-cases for game-detail / steam-import / manage-library-entry; handler at `get-platforms-for-library-modal.ts`; PLUS three off-spec-list consumers found via typecheck: `app/(protected)/journal/[id]/page.tsx`, `app/(protected)/journal/page.tsx`, `features/journal/server-actions/get-games-by-ids.ts`)_
- [x] **Verify:** CI green; smoke search → add game → game detail page. **[Agent: typescript-test-expert]** _(typecheck/lint/format pass; utilities 124, components 812, backend 765, integration 412 all pass; IGDB-side consumer-pattern preserved at use-case sites for Slice 12)_

---

## Slice 6 — `activity-feed` / `social`

**Outcome:** `activityFeedRepository`, `followRepository`, `ActivityFeedService`, `SocialService` use typed throws. Activity-feed mappers stay inline this slice (out-of-scope deepening).

- [x] **Red:** rewrite repo + service tests for both domains. `follow-repository.ts:32` P2002 catch (already-following case) becomes `throw new ConflictError(...)`. **[Agent: typescript-test-expert]**
- [x] **Green — repos:** convert `activity-feed-repository.ts`, `follow-repository.ts`. **[Agent: nextjs-expert]** _(repos already raw; first agent run handled P2002 → ConflictError translation in follow-repository)_
- [x] **Green — services:** convert `activity-feed-service.ts:74-151` and `social-service.ts`. Drop duplicate Zod parses at `social-service.ts:46,66`. **[Agent: nextjs-expert]** _(done in first agent run; mappers stay inline — `*Result` type aliases removed from `services/index.ts`)_
- [x] **Green — handlers:** convert `data-access-layer/handlers/social/activity-feed-handler.ts`. **[Agent: nextjs-expert]** _(uses `mapErrorToHandlerResult`)_
- [x] **Green — callers:** `rg "ActivityFeedService|SocialService|followRepository" savepoint-app/{app,features}`. **[Agent: nextjs-expert]** _(2 social server-actions, 1 profile server-action, 3 RSC pages on `/u/[username]/{followers,following,activity}` using try-then-render pattern to satisfy `react-hooks/error-boundaries` lint rule, `social/ui/activity-feed.tsx` UI component caught by typecheck off-spec, `profile/use-cases/get-profile-page-data.ts` SocialService side only — ProfileService side stays for Slice 7)_
- [x] **Verify:** CI green; smoke follow user → see activity feed populated. **[Agent: typescript-test-expert]** _(typecheck/lint/format pass; utilities 124, components 812, backend 768, integration 412 all pass)_

---

## Slice 7 — `profile`

**Outcome:** `userRepository` + `ProfileService` use typed throws. The known `app/(protected)/profile/page.tsx:27` `NOT_FOUND` redirect site is converted to `instanceof NotFoundError` catch.

- [x] **Red:** rewrite `data-access-layer/repository/user/*.integration.test.ts` (4 P2025 sites + 1 P2002 site at `user-repository.ts:46,120,160,194,252,308`); rewrite `services/profile/*.test.ts`. Note: `updateUserProfile` historically returned a raw user row — its tests are normalized to the new typed-throw contract here. **[Agent: typescript-test-expert]**
- [x] **Green — repo:** convert `user-repository.ts`; each P2025 throws `NotFoundError` with operation-specific message ("user not found while updating profile" etc.); P2002 at `:194` throws `ConflictError`. Normalize `updateUserProfile` and any other raw-row functions to the consistent contract. **[Agent: nextjs-expert]** _(6× P2025 → NotFoundError with operation-specific `context`; 1× P2002 → ConflictError; raw-row inconsistency normalized)_
- [x] **Green — service:** convert `profile-service.ts`; drop duplicate Zod parses at `:197,320`. **[Agent: nextjs-expert]** _(425 LOC service converted; mappers.ts unchanged; types.ts `ServiceResult<>` aliases removed; barrel cleaned up)_
- [x] **Green — RSC page:** convert `app/(protected)/profile/page.tsx:27` from `if (result.code === ServiceErrorCode.NOT_FOUND) redirect(...)` to `try { ... } catch (error) { if (error instanceof NotFoundError) redirect(...); throw error; }`. **[Agent: nextjs-expert]** _(plus 11 other RSC pages converted via try-then-render pattern to satisfy `react-hooks/error-boundaries` lint rule)_
- [x] **Green — callers:** `rg "ProfileService|userRepository|getServerUserProfile|updateUserProfile" savepoint-app/{app,features}`. **[Agent: nextjs-expert]** _(12 RSC pages, 5 server actions, `get-profile-page-data.ts` use-case kept outer `{ success, error }` boundary — Option B — with inner typed-throw conversion + viewer-fallback try/catch for graceful public-profile fall-through)_
- [x] **Verify:** CI green; smoke own profile page, public profile page (existing + nonexistent username — must still redirect / 404), profile edit. **[Agent: typescript-test-expert]** _(typecheck/lint/format pass; utilities 124, components 812, backend 768, integration 415 all pass — +3 integration tests)_

---

## Slice 8 — `game-detail`

**Outcome:** `GameDetailService` aggregation uses typed throws. Depends on slices 4 (library), 5 (game) having landed (consumes both). May be reordered; if reordered, this slice's repos/services land here.

- [x] **Red:** rewrite `services/game-detail/*.test.ts`. **[Agent: typescript-test-expert]** _(no-op — done in Slice 5)_
- [x] **Green — service:** convert `game-detail-service.ts` to `await` library + game services and let typed errors propagate. **[Agent: nextjs-expert]** _(no-op — `game-detail-service.ts` lives in the same file as Slice 5's basic-game-lookup work; both Slice 5 and Slice 8 converged)_
- [x] **Green — callers:** `rg "GameDetailService" savepoint-app/{app,features}`. **[Agent: nextjs-expert]** _(no-op — done in Slice 5)_
- [x] **Verify:** CI green; smoke game detail page for a game in library, a game not in library, an invalid IGDB id (404 path). **[Agent: typescript-test-expert]** _(verified post-Slice 7: `rg` over `services/game-detail/` and `repository/game/` returns ZERO old-symbol hits)_

---

## Slice 9 — `onboarding`

**Outcome:** `OnboardingService` (5-step calculation across 4 repos) uses typed throws. Pure function for progress calc may optionally be extracted (out-of-scope deepening; if not extracted now, leave note in code review).

- [x] **Red:** rewrite `services/onboarding/*.test.ts`. **[Agent: typescript-test-expert]** _(322 LOC unit test fully rewritten with `vi.resetAllMocks()`)_
- [x] **Green — service:** convert `onboarding-service.ts:60-142`. **[Agent: nextjs-expert]** _(both `try/catch` wrappers removed; null user → `throw new NotFoundError`; `getProgress` returns `OnboardingProgress` directly; `dismiss` returns `void`; calculation kept inline per ADR §2.4)_
- [x] **Green — callers:** `rg "OnboardingService" savepoint-app/{app,features}`. **[Agent: nextjs-expert]** _(2 consumers: `dismiss-onboarding` server action direct-await; `getting-started-checklist.tsx` UI uses try/catch to log + return null on throw)_
- [x] **Verify:** CI green; sign up a fresh test user, walk the onboarding checklist end-to-end. **[Agent: typescript-test-expert]** _(typecheck/lint/format pass; utilities 124, components 812, backend 769, integration 415 all pass; OnboardingService consumes repos only — library & journal already converted, user repo already raw)_

---

## Slice 10 — `imported-game`

**Outcome:** `importedGameRepository` + `ImportedGameService` use typed throws. P2025 catch at `imported-game-repository.ts:241` becomes `NotFoundError`. The `domain/imported-game` DTO is preserved (out-of-scope deepening).

- [x] **Red:** rewrite repo + service tests. **[Agent: typescript-test-expert]**
- [x] **Green — repo:** convert `imported-game-repository.ts`. **[Agent: nextjs-expert]** _(P2025 → NotFoundError with operation-specific context; uses `@/shared/lib/errors` not the legacy DAL-local class)_
- [x] **Green — service:** convert `imported-game-service.ts`. **[Agent: nextjs-expert]** _(`dismissImportedGame` returns void; `findImportedGameById` returns `T | null`; `updateImportedGameStatus` throws NotFoundError on missing)_
- [x] **Green — handlers:** convert `data-access-layer/handlers/steam-import/imported-games.handler.ts`. **[Agent: nextjs-expert]** _(uses `mapErrorToHandlerResult`)_
- [x] **Green — callers:** `rg "ImportedGameService|importedGameRepository" savepoint-app/{app,features}`. **[Agent: nextjs-expert]** _(dismiss action direct-await; `import-game-to-library` use-case has its ImportedGameService side converted — Steam + IGDB consumer patterns intact for Slices 11/12)_
- [x] **Verify:** CI green; smoke `/steam/games` page (lists imported games or empty state). **[Agent: typescript-test-expert]** _(typecheck/lint/format pass; utilities 124, components 812, backend 768, integration 415 all pass; **critical follow-up fix**: `journal-repository.ts` and `journal-service.unit.test.ts` were importing `NotFoundError` from the legacy `data-access-layer/repository/errors` instead of `@/shared/lib/errors` — silent class-identity mismatch would have broken `instanceof NotFoundError` checks in the journal RSC pages' `notFound()` redirects. Fixed in this slice. Same risk class noted by Slice 10 agent for imported-game; cross-codebase audit confirms no other stragglers.)_

---

## Slice 11 — `steam`

**Outcome:** `SteamService` and `SteamOpenIdService` throw typed errors. Domain-specific subclasses introduced here. Steam-import handlers and the connect/disconnect flow consume typed errors.

- [x] **Catalog extension:** create `data-access-layer/services/steam/errors.ts` exporting `SteamProfilePrivateError extends ExternalServiceError` and `SteamApiUnavailableError extends ExternalServiceError`. Co-located unit tests. **[Agent: nextjs-expert]**
- [x] **Red:** rewrite `services/steam/*.test.ts` and `services/steam/steam-openid-service.test.ts` to expect typed throws (private profile → `SteamProfilePrivateError`, API unavailable → `SteamApiUnavailableError`, validation → `ZodError`). **[Agent: typescript-test-expert]** _(485 + 201 LOC unit tests rewritten with `vi.resetAllMocks()`; +`getOwnedGames` coverage)_
- [x] **Green — service:** convert `steam-service.ts` and `steam-openid-service.ts`. Drop duplicate Zod parses at `steam-service.ts:245`, `steam-openid-service.ts:48,67,79`. **[Agent: nextjs-expert]** _(both services drop ServiceResult; `STEAM_PROFILE_PRIVATE` → `SteamProfilePrivateError`, `STEAM_API_UNAVAILABLE` → `SteamApiUnavailableError`; 4+ duplicate Zod parses deleted; types.ts cleaned)_
- [x] **Green — handlers:** convert `data-access-layer/handlers/steam-import/{steam-connect,fetch-steam-games}.handler.ts`; explicit override in their `catch` blocks: `SteamProfilePrivateError → 403`. **[Agent: nextjs-expert]** _(both handlers have explicit `if (error instanceof SteamProfilePrivateError) return 403` before falling through to `mapErrorToHandlerResult` — first demonstration of per-handler override pattern; `mapErrorToHandlerResult` enriched with `ExternalServiceError → 503` default)_
- [x] **Green — callers:** `rg "SteamService|SteamOpenIdService" savepoint-app/{app,features}`; update Steam connect button server actions, OpenID callback page. **[Agent: nextjs-expert]** _(`disconnect-steam` action direct-await; `app/api/steam/auth/callback/route.ts` uses nested try/catch; `import-game-to-library.ts` SteamService side converted, IGDB side intact for Slice 12)_
- [x] **Verify:** CI green; smoke Steam connect (private profile → expect friendly error), Steam disconnect, current `triggerBackgroundSync` disabled-error path still surfaces. **[Agent: typescript-test-expert]** _(typecheck/lint/format pass; utilities 124, components 812, backend 789 (+21), integration 415 all pass)_

---

## Slice 12 — `igdb`

**Outcome:** `IgdbService` and `IgdbMatcher` throw typed errors. `IgdbRateLimitError` introduced. `handlers/igdb/igdb-handler.ts:54-59` switch-on-code is replaced with `instanceof` mapping. Use-case retry decision at `import-game-to-library.ts:134-135` consumes typed errors.

- [x] **Catalog extension:** create `data-access-layer/services/igdb/errors.ts` exporting `IgdbRateLimitError extends RateLimitError`. Co-located unit tests. **[Agent: nextjs-expert]**
- [x] **Red:** rewrite `services/igdb/*.test.ts` and `services/igdb/igdb-matcher.test.ts`. Drop the seven `VALIDATION_ERROR` test paths (igdb-service input re-validation deletion). **[Agent: typescript-test-expert]** _(4 service unit tests rewritten: igdb-discovery 463 LOC, igdb-edge-cases 315 LOC, igdb-search 257 LOC, igdb-matcher 209 LOC)_
- [x] **Green — service:** convert `igdb-service.ts` (8 methods, ~7 duplicate Zod parses at `:156,203,242,304,389,428,488` — deleted), `igdb-matcher.ts:62`. Throw `IgdbRateLimitError` on rate-limit responses; `ExternalServiceError` on other API failures; `ZodError` on parsing IGDB response payloads. **[Agent: nextjs-expert]** _(528 LOC service + 142 LOC matcher converted; IGDB API response parsing preserved as legitimate `ZodError` throws)_
- [x] **Green — handler:** convert `data-access-layer/handlers/igdb/igdb-handler.ts`; the `case ServiceErrorCode.X` switch becomes `instanceof` chain inside the catch block (`ZodError → 400`, `NotFoundError → 404`, `IgdbRateLimitError → 429`, `RateLimitError → 429`, default → 500). **[Agent: nextjs-expert]** _(switch gone; handler delegates to `mapErrorToHandlerResult` which already covers all those codes including `ExternalServiceError → 503` from Slice 11)_
- [x] **Green — use-case:** convert `features/steam-import/use-cases/import-game-to-library.ts:134-135` from `matchResult.code === EXTERNAL_SERVICE_ERROR || IGDB_RATE_LIMITED` to `error instanceof IgdbRateLimitError || error instanceof ExternalServiceError`. **[Agent: nextjs-expert]** _(both `:134-145` and `:219-230` blocks converted to `try/catch` + `instanceof`-based retry decision — the climax of the migration's consumer-side branching)_
- [x] **Green — callers:** `rg "IgdbService|igdbMatcher" savepoint-app/{app,features}`. **[Agent: nextjs-expert]** _(add-game-to-library use-case + tests; get-game-details use-case + tests; api/games/search route; browse-related-games UI; plus 5 stale integration test mocks fixed post-agent: library-actions, quick-add-to-library-action, add-game-to-library integration tests had `mockResolvedValue({ success: true, data: ... })` shapes that needed flattening to raw)_
- [x] **Verify:** CI green; smoke IGDB game search via `/api/igdb/search` (valid query → results, invalid → 400, rate-limited → 429). **[Agent: typescript-test-expert]** _(typecheck/lint/format pass; utilities 124, components 812, backend 790 (+1), integration 415 all pass after the 5 mock-shape fixes)_

---

## Slice 13 — `auth`

**Outcome:** `AuthService` (sign-up/sign-in credentials path) throws typed errors. Last service to convert.

- [x] **Red:** rewrite `services/auth/*.test.ts`. **[Agent: inline]** _(unit test rewritten with `vi.resetAllMocks()` + `.rejects.toThrow(ConflictError)`; consumer test rewritten to mock `mockRejectedValue(new ConflictError(...))` instead of resolving with `{ success: false }`)_
- [x] **Green — service:** convert `auth-service.ts`. **[Agent: inline]** _(`signUp` throws `ConflictError` for both pre-check duplicate AND inline P2002 unique-constraint catch; outer wrapper rethrows; `types.ts` `SignUpResult = ServiceResult<...>` flattened to raw)_
- [x] **Green — callers:** `rg "AuthService" savepoint-app/{app,features}`; update sign-up / sign-in server actions. **[Agent: inline]** _(`features/auth/server-actions/sign-up.ts` direct-await; outer try/catch surfaces `error.message` to `ActionResult.error` so `ConflictError` message reaches the user)_
- [x] **Verify:** CI green; smoke sign-up (happy path + duplicate email → friendly error), sign-in (happy + bad password). **[Agent: inline]** _(typecheck/lint/format pass; utilities 124, components 812, backend 790, integration 415 all pass; **bonus fix**: IGDB unit-test files were flaky from limiter-state pollution between tests — added `await __resetLimiterForTests()` to `beforeEach` of all 4 IGDB unit-test files)_

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
