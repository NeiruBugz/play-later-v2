# Audit Recommendations — 2026-05-23

Overall: **94% (93.6%) — Grade A**, up from 90% B on 2026-05-18. The spec-021 TanStack migration is fully landed (`savepoint-app/` removed), which resolved the two largest prior gaps (End-to-End Delivery 64%→93%, Code Architecture 89%→100%). One critical blocker remains, plus a set of low-effort cleanups left behind by the migration.

## P0 — Fix Immediately

### 1. Repin or allowlist the `nitro` beta inside the quarantine window

- **Dimension:** Supply Chain Security
- **Check:** SCS-04 (7-day quarantine) — critical FAIL
- **Effort:** Low
- **Details:** `nitro@3.0.260522-beta` was published 2026-05-22 (1 day ago), is a beta, sits inside the 7-day quarantine window, and is **not** in the allowlist. It is pinned in the committed `pnpm-lock.yaml`. Either:
  - Repin `nitro` to a stable version published more than 7 days ago (preferred — betas should not be in a deployable lockfile), or
  - If the beta is required, add it to `scripts/package-freshness-allowlist.json` with a documented risk review and an expiry date (mirror the existing `@tanstack/react-start` / `react-router` CVE-remediation entries).
  - This single change clears the critical FAIL and lifts Supply Chain Security to ~89% (B).
  - Verify with: `node scripts/check-package-freshness.mjs` (the CI gate) and re-run `pnpm install` to confirm the lockfile.

## P1 — Fix Soon

### 2. Add an end-to-end test tier

- **Dimension:** Quality Assurance
- **Check:** QA-04 (E2E tier present) — high FAIL
- **Effort:** Medium
- **Details:** There is no E2E tooling (no `playwright.config.*`, no `e2e/` dir, no Playwright/Cypress dep). The unit (136) and integration (48) tiers are excellent and gated by coverage thresholds, but no test exercises a full user journey through the real UI. Add Playwright (`pnpm --filter savepoint-tanstack add -D @playwright/test`, pin exact) and cover 2-3 critical flows: auth/login, library add + status change, Steam import. Wire it into `pr-checks-tanstack.yml`. This is the project's single material testing gap.

## P2 — Improve When Possible

### 3. Rewrite the stale `savepoint-tanstack/README.md`

- **Dimension:** Documentation Quality
- **Check:** DOC-04 (no stale docs) — medium FAIL
- **Effort:** Low
- **Details:** The README was never updated after the spec-021 cutover. It still: frames the app as "Under construction" / a side-by-side rewrite of `../savepoint-app/` (removed); gives a wrong setup command `pnpm --filter savepoint prisma migrate dev` (no `savepoint` package — only `savepoint-tanstack`); tells contributors "Don't migrate here… Migrate in `../savepoint-app/`" though 50 migrations now live in `savepoint-tanstack/prisma/migrations/`; and references a CI schema-drift check against the deleted `../savepoint-app/prisma/schema.prisma`. Rewrite to reflect that this is the sole deployed app and owns its migrations. It directly contradicts the (correct) root README and sibling CLAUDE.md.

### 4. Fix the `infra/` module path in docs

- **Dimension:** Documentation Quality
- **Check:** DOC-04 (no stale docs) — medium FAIL (secondary)
- **Effort:** Low
- **Details:** `infra/CLAUDE.md` and `infra/README.md` cite module paths at `infra/modules/cognito`, but the actual location is `infra/envs/modules/cognito/`. Correct both references.

### 5. Repoint the dead format-on-save hook

- **Dimension:** AI Development Tooling / Prompt & Agent Integrity (non-scored cleanup)
- **Check:** observed during PAI-03
- **Effort:** Low
- **Details:** `.claude/hooks/format-and-lint.sh` (line 4) still hardcodes the removed `savepoint-app/` path, so it silently no-ops on all current files. Repoint it to `savepoint-tanstack/` so the post-edit prettier/eslint hook actually runs. Benign but currently dead.

### 6. Pin remaining caret dependencies to exact versions

- **Dimension:** Supply Chain Security
- **Check:** SCS-03 (no permissive version ranges) — high WARN
- **Effort:** Low
- **Details:** All 75 app deps are exact-pinned, but the root devDep `@commitlint/config-conventional ^20.2.0` and three overrides (`valibot`, `glob`, `js-yaml`) still use carets — against the stated exact-pinning preference. Pin them to exact versions to remove the residual re-resolution risk and clear the WARN.

### 7. Review dependency bloat (transitive count > 1000)

- **Dimension:** Supply Chain Security
- **Check:** SCS-08 (attack surface) — medium FAIL
- **Effort:** Medium
- **Details:** 1110 resolved registry tarballs exceeds the >1000 threshold, though the direct-to-total ratio (~14.6:1) is healthy and the count is driven by a legitimately large stack (TanStack + React 19 + AWS SDK + Prisma). Either audit `pnpm-lock.yaml` for prunable/duplicated dev dependencies, or document explicit acceptance in `DEPENDENCY_DECISIONS.md` with the rationale so this stops surfacing as a FAIL.

### 8. Add a test-data factory/fixture layer

- **Dimension:** Quality Assurance
- **Check:** QA-07 (test data management) — low WARN
- **Effort:** Low
- **Details:** Integration tests build data inline via Prisma `create` with no factory library or seed. Introduce `fishery` or `@faker-js/faker` (pin exact) or a `prisma/seed.*` to centralize test-data construction and reduce duplication across the 48 integration tests.

### 9. Refresh `DEPENDENCY_DECISIONS.md`

- **Dimension:** Supply Chain Security
- **Check:** observed during SCS-07
- **Effort:** Low
- **Details:** The doc records `hono ^4.12.2` / `fast-xml-parser 5.4.1` while the manifest now pins `hono 4.12.18` / `fast-xml-parser 5.7.3` (both tightened to exact — drift is in the safe direction). Update to match current pins.

### 10. Confirm intent of the legacy `Review` Prisma model

- **Dimension:** End-to-End Delivery
- **Check:** E2E-04 (no orphaned artifacts) — medium WARN
- **Effort:** Low
- **Details:** The `Review` model in `savepoint-tanstack/prisma/schema.prisma` is the single orphan — annotated `Legacy/unused. Pending Reviews spec (Phase 2B). User-facing ratings live on LibraryItem.rating`. It is intentional and documented, so no action is required now; track it so it doesn't linger indefinitely if Phase 2B is deprioritized.
