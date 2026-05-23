# Documentation Quality — Audit Results

**Date:** 2026-05-23
**Score:** 83% — Grade **B**

## Results

| # | Check | Severity | Status | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Root README exists and is useful | critical | PASS | `README.md` (77 lines): name, description, `docker compose`/`pnpm install`/`prisma:migrate`/`dev` setup block + common commands — followable and matches `package.json` scripts. |
| 2 | Service-level READMEs exist | high | PASS | Both service dirs covered: `savepoint-tanstack/README.md` (Getting started + Common commands table) and `infra/README.md` (Dev quickstart, `terraform init/apply`). |
| 3 | API docs proportional to surface | medium | SKIP | Small closed internal API: co-located client+server via `createServerFn` RPC (52 files), no public/OpenAPI surface. No openapi/swagger files found (expected). Skip-When met. |
| 4 | No stale docs | medium | FAIL | 4+ inaccurate claims in `savepoint-tanstack/README.md`: (a) "Under construction… rewrite of `../savepoint-app/`" — `savepoint-app/` removed; (b) line 33 `pnpm --filter savepoint prisma migrate dev` — no `savepoint` package (only `savepoint-tanstack`); (c) line 72 "Don't migrate here… Migrate in `../savepoint-app/`" — migrations now owned here (50 in `prisma/migrations/`); (d) line 53 CI drift-check vs `../savepoint-app/prisma/schema.prisma` — path gone. Plus `infra/CLAUDE.md`+`infra/README.md` cite `infra/modules/cognito` but actual is `infra/envs/modules/cognito/`. |

## Notes

- **DOC-04 is the dominant issue:** `savepoint-tanstack/README.md` was never updated after spec-021 cutover (commit 17f0ad42 marked spec 021 Completed). It still frames the app as an in-progress side-by-side rewrite and points to the deleted `savepoint-app/`. Root `README.md` and `savepoint-tanstack/CLAUDE.md` are correct ("migration complete; sole, deployed app; owns Prisma migrations"), so the README directly contradicts its sibling sources of truth.
- DOC-02 passes on existence + build/run commands (the tanstack README's command table is valid), but its surrounding narrative is the stale content flagged in DOC-04.
- `savepoint-app/` references in `context/spec/**`, `context/decisions/**`, and `docs/cutover-rollback.md` are historical/archival (specs, ADRs, rollback runbook) and not scored as stale.

## Scoring

- Weights: DOC-01 critical=3, DOC-02 high=2, DOC-03 skipped, DOC-04 medium=1.
- max_points = 3 + 2 + 1 = 6
- deductions = DOC-04 FAIL (full medium weight) = 1.0
- pct = (6 − 1) / 6 × 100 = 83.3% → **Grade B**
