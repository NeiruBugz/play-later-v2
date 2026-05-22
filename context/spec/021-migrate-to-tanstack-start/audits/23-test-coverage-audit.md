# Slice 23 — Test-Coverage Audit (`savepoint-tanstack/`)

> **Spec:** 021 Migrate to TanStack Start · **Slice:** 23 (Final parity audit) · **Date:** 2026-05-22
> **Agent:** `typescript-test-expert` · **Scope:** (1) every server fn has an integration test; (2) every ported feature UI has ≥1 component test; (3) ≥85% statements on `src/{entities,features}` excluding barrels.
> **Gate verdict:** ✅ **PASS** (re-verified 2026-05-22 after coverage remediation A+B+C). *Original audit was 🚫 BLOCKED on 5 integration gaps + 2 zero-test feature UIs + an unmeasurable Check 3; all resolved.* See § Remediation at end.

## Summary

42 server fns/entity queries audited — 5 genuine integration gaps (rest covered directly or transitively). 44 feature UI components — 2 features (`game-detail`, `search-games`) have **zero** component tests; ~5 sub-components elsewhere lack their own test (mostly covered transitively or pure presentation). Coverage: **not configured anywhere** (no vitest `coverage` block, no script, no CI gate, no unit+integration merge). Unit-only ad-hoc run = 45.7% statements — but that is a **measurement artifact** (entity `.server.ts` files are 0% under jsdom because they're DB-backed and only reachable from integration tests). The ≥85% threshold cannot be correctly measured until unit+integration coverage are merged.

## Check 1 — server fn integration coverage

Method: server fns (`createServerFn` in `features/*/api/<name>.ts`) delegate to a `<name>.worker.ts` or directly to an `entities/*/api/*.server.ts` query. Integration tests import the worker/entity (foot-gun #8 — not the wrapper). Thin pass-throughs are covered transitively via their tested entity query.

**Covered (representative):** all journal CRUD (`create/update/delete/getById/timeline`), library (`add/update/delete/quickAdd/getLibrary/uniquePlatforms/stats`), game-detail (`getGameDetails/timesToBeat/relatedGames`), profile (`getProfileById/getProfileSetupStatus`), steam (`connect/disconnect/import/fetch/dismiss`), follow (`follow/unfollow/listFollowers/listFollowing`), avatar (`presign/setUrl`), `updateProfile`, `searchGames` (via shared IGDB client), session helpers — all have direct or transitive integration tests.

**Genuine gaps (5):**

| # | Server fn / query | File | Severity | Why |
|---|---|---|---|---|
| F1.1 | `getDashboardPageDataWorker` | `features/dashboard/api/get-dashboard-page-data.worker.ts` | HIGH | Non-trivial composition (quickLog/continuePlaying/upNext/recentlyAdded slicing, `showStats: total>=STATS_MIN_GAMES` gate, `safeName` `@`-strip greeting) — none tested; only the underlying entity queries are tested in isolation |
| F1.2 | `getActivityForUser` entity | `entities/activity-feed/api/get-activity-feed.server.ts:60` | HIGH | Public per-user activity stream (profile activity tab). Integration test only exercises `getActivityFeedForViewer`, not this export |
| F1.3 | `getOnboardingSignals` entity | `entities/profile/api/get-onboarding-signals.server.ts` | MEDIUM | Backs `getSteamConnectionFn` + `getLibraryPageDataFn`; no direct integration test |
| F1.4 | `getUsernameAvailability` entity | `entities/profile/api/get-username-availability.server.ts` | MEDIUM | UX-hint query (non-enforcement) but its normalized-lookup + `excludeUserId` SQL is untested |
| F1.5 | `countFollowers` / `countFollowing` / `isFollowing` | `entities/follow/api/{count-followers,count-following,is-following}.server.ts` | MEDIUM | Used by `getPublicProfilePageDataFn` via `Promise.all`; no individual integration tests |

`getEmailSignInEnabledFn` (env-flag only, no DB) has no test of any kind — LOW, env-branch untested.

## Check 2 — feature UI component tests

**Zero-test features (blocking):**

| # | Feature | Components | Severity |
|---|---|---|---|
| F2.1 | `game-detail` | `times-to-beat-section` (has `formatHours` seconds→hours logic + "N/A" branch), `times-to-beat-skeleton` | HIGH |
| F2.2 | `search-games` | `search-games-results` (148 lines: idle→loading→success/error states, calls `searchGamesFn`), `search-games-input` (debounced navigate-on-type) | HIGH |

**Sub-component gaps (medium/low — many covered transitively by parent or pure presentation):**
- F2.3 `manage-library-entry/library-card-menu` (156 lines: dropdown + status-change + toast + nav) — MEDIUM, separate entry point from `library-modal`.
- F2.4 `edit-profile/username-input` (66 lines: debounced availability indicator states) — MEDIUM, `profile-settings-form.test` doesn't exercise the availability path.
- F2.5 `filter-library/{status-list,rating-controls,platform-select,sort-select}` — LOW, composed inside tested `LibraryFilters`/`MobileFilterBar` (confirm parent tests exercise child interactions).
- F2.6 `auth-sign-out/logout-button` — LOW, likely covered by `-_authed-settings-account.test.tsx` route test (confirm it fires the click).
- `related-games-skeleton`, `empty-library-hero`, `profile-visibility-toggle` — pure presentation, acceptable gaps.

## Check 3 — coverage threshold

**Configuration: NONE.** `vitest.config.ts` has no `coverage` block (no provider/include/exclude/thresholds); `package.json` has no coverage script; CI has no coverage gate for `savepoint-tanstack`.

**Ad-hoc unit-only measurement** (`--coverage.provider=v8 --coverage.include='src/entities/**' --coverage.include='src/features/**' --coverage.exclude='**/index.ts'`, `unit` project only):

| Scope | Statements | Branches | Functions |
|---|---|---|---|
| `src/entities` | 14.6% (78/536) | 18.1% | 23.4% |
| `src/features` | 58.1% (779/1341) | 59.2% | 56.8% |
| **Combined** | **45.7%** (857/1877) | 43.4% | 49.7% |

**This 45.7% is a measurement artifact, not a true coverage figure.** Entity `*.server.ts` files use Prisma directly and are unreachable from the jsdom unit project (Prisma mocked at module level), so all 36 entity query files report 0% under unit — they're covered by **integration** tests (real PG), which weren't included in this run and have no merged-coverage setup. The feature layer (58.1% unit-only) likewise undercounts, since integration tests exercise feature workers not reflected in unit coverage. **The ≥85% threshold cannot be correctly evaluated until unit + integration coverage are merged.**

## Tooling note (the deepest finding)

Coverage is **not measured or enforced anywhere** — no config, no script, no CI gate, no unit/integration merge. Prior slices could have regressed coverage with zero signal. This mirrors the FSD audit's resolver gap: a gate that *cannot be evaluated* because the tooling was never wired. Specific gaps:
1. No `coverage` script in `package.json`.
2. No `coverage.thresholds` in `vitest.config.ts`.
3. No workspace-level merge of `unit` + `integration` coverage (the two projects run independently).
4. CI runs tests but collects no coverage.

## Gate verdict

🚫 **BLOCKED.** Required before PASS:
1. **Coverage infra** — configure vitest coverage (provider + include `src/{entities,features}` + exclude barrels), merge `unit` + `integration` coverage, add a `coverage` script + `thresholds`, wire a CI gate. Until this exists Check 3 cannot be measured (and can silently regress). **Highest leverage — measure correctly before judging.**
2. **Fill the 5 server-fn integration gaps** (F1.1–F1.5): dashboard worker, `getActivityForUser`, `getOnboardingSignals`, `getUsernameAvailability`, follow-counts (3 queries).
3. **Component tests for the 2 zero-test features** (F2.1 `game-detail`, F2.2 `search-games`); triage the medium sub-component gaps (F2.3–F2.4) by real-logic-vs-presentation.
4. Re-measure Check 3 against ≥85% with the merged coverage; close any remaining genuine shortfall.

## § Remediation (2026-05-22) — gate now PASS

**A. Coverage made measurable.** Added a root-level `coverage` block to `vitest.config.ts` (v8; include `src/{entities,features}/**/*.{ts,tsx}`; exclude barrels `**/index.ts`, tests, `*.type.ts`, `model/types.ts`, `*.gen.ts`; reporters text-summary + json-summary + html). A single `vitest run --coverage` runs BOTH projects and v8 merges them into one report. Added `test:coverage` script + `@vitest/coverage-v8@4.1.5` (exact). True merged baseline revealed: **70.04%** combined (entities 79.55%, features 66.29%) — the prior 45.7% was a unit-only artifact (entity `.server.ts` are integration-tested). Denominator sanity confirmed (27/33 entity queries non-zero via integration).

**B. Gaps filled (Checks 1 & 2 + coverage to ≥85%).** Wrote the 5 named integration tests (`getDashboardPageDataWorker`, `getActivityForUser`, `getOnboardingSignals`, `getUsernameAvailability`, follow-counts ×3) + component tests for the 2 zero-test features (`game-detail/times-to-beat-section`, `search-games/{results,input}`) + medium gaps with real logic (`manage-library-entry/library-card-menu`, `edit-profile/username-input`); pure-presentation components (skeletons, toggles) skipped. Then iterated on lowest-coverage feature modules until the bar cleared.

**C. Threshold + CI gate enforced.** `vitest.config.ts` `coverage.thresholds`: `statements: 85` (the gate metric, not lowered) + regression floors `branches: 86`, `lines: 83`, `functions: 79` (a couple points under verified actuals, to lock against backsliding without flapping). CI gate wired into `.github/workflows/pr-checks-tanstack.yml` (the `quality` job now runs `test:coverage` — both projects + threshold enforcement — with docker-compose Postgres provisioning + `pg_isready` wait for the integration coverage run).

**Verified (orchestrator, 2026-05-22):** `test:coverage` exit 0 with thresholds enforced · **statements 85.04% (1587/1866)** · branches 88.46% · lines 84.68% · functions 81.17% · **186 files / 1610 tests pass** · typecheck/lint/format exit 0.

**Non-blocking follow-up:** statements clears 85 by ~1 statement (1587 vs 1586.1 needed) — thin headroom; the next PR adding untested statements will (correctly) trip the gate. Build a few points of buffer in follow-up work so the gate guides rather than blocks routine changes.
