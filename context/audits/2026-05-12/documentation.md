# Documentation Quality — Audit Results

**Date:** 2026-05-12
**Score:** 67% — Grade **C**

## Results

| #   | Check                                    | Severity | Status | Evidence |
| --- | ---------------------------------------- | -------- | ------ | -------- |
| 1   | DOC-01 Root README exists and is useful  | critical | WARN   | `README.md` exists with name/description/setup/run steps, but contains stale claim "infra: Terraform infrastructure (RDS, ECS, S3, ...)" — `infra/modules/` only contains `cognito` + `s3`; RDS/ECS not present (same issue flagged in previous audit, still unfixed) |
| 2   | DOC-02 Service-level READMEs exist       | high     | PASS   | All 3 service dirs have READMEs: `savepoint-app/README.md`, `savepoint-tanstack/README.md`, `infra/README.md`. `savepoint-tanstack/README.md` is the auto-generated TanStack Start starter (thin but present); savepoint-app + infra READMEs include build/run instructions |
| 3   | DOC-03 API documentation is available    | high     | SKIP   | No external API surface — topology summary shows Next.js route handlers + TanStack Start `createServerFn`, all with co-located clients in same repo; no third-party consumers; no GraphQL/gRPC. Matches Skip-When ("small closed API with co-located client") |
| 4   | DOC-04 No stale documentation            | medium   | FAIL   | 6 stale claims sampled (≥3 = FAIL): (1) root `CLAUDE.md:12` lists infra modules "Cognito, S3, ECR, SQS, Secrets Manager" — only `cognito` + `s3` exist; (2) root `CLAUDE.md:11` "Monorepo with two layers" — topology shows three (savepoint-app + savepoint-tanstack + infra); savepoint-tanstack not mentioned anywhere in root CLAUDE.md; (3) root `CLAUDE.md:14` "pnpm 10 workspace with `savepoint-app/` as the sole JS package" — `pnpm-workspace.yaml` declares both savepoint-app + savepoint-tanstack; (4) root `CLAUDE.md:11` "Next.js 15" — savepoint-app is Next.js 16.2 per topology; (5) root `CLAUDE.md` "Agent skills" section references `CONTEXT-MAP.md` at root + `savepoint-app/CONTEXT.md` + `infra/CONTEXT.md` — none of these files exist; (6) root `README.md:10` "infra: Terraform infrastructure (RDS, ECS, S3, ...)" — RDS/ECS absent from `infra/modules/` |

## Scoring

- Max points: 3 (DOC-01 critical) + 2 (DOC-02 high) + 1 (DOC-04 medium) = 6 (DOC-03 SKIP excluded)
- Deductions: DOC-01 WARN (critical) = 1.5; DOC-04 FAIL (medium) = 1.0; total = 2.0
- Raw score: 6 − 2.0 = 4.0
- Percentage: 4.0 / 6 × 100 = 66.7% → **67%** → Grade **C**

## Documentation Summary

- **Root README:** present, with quickstart + AWOS workflow, but stale infra module list
- **Per-layer READMEs:** all 3 layers covered (savepoint-app, savepoint-tanstack, infra)
- **Per-layer CLAUDE.md depth:** strong — root + `savepoint-app/app/`, `savepoint-app/data-access-layer/`, `savepoint-app/features/`, `savepoint-app/widgets/`, `savepoint-tanstack/`, `infra/`
- **API contracts:** none required (internal-only RPC; no OpenAPI/GraphQL/gRPC files; correctly skipped)
- **Spec system:** `context/spec/` actively maintained (most recent spec 021 TanStack migration, in flight)
- **Stale-doc regression:** previous audit flagged root CLAUDE.md/README references to retired infra (RDS/ECS/ECR/SQS); not addressed. Root CLAUDE.md and README both still describe a defunct stack and an out-of-date layer count
- **Missing referenced files:** root `CLAUDE.md` references `CONTEXT-MAP.md`, `savepoint-app/CONTEXT.md`, `infra/CONTEXT.md` — none exist; only `docs/agents/domain.md` is real

## Recommended fixes (input for recommendations.md)

1. **P1 (effort: Low)** — Update root `CLAUDE.md` lines 7–19: rewrite Architecture table to list three layers (savepoint-app Next.js 16, savepoint-tanstack TanStack Start, infra Terraform); fix module list to `cognito`, `s3` only; update Next.js version to 16; remove ECR/SQS/Secrets Manager mentions
2. **P1 (effort: Low)** — Update root `README.md` line 10: replace "RDS, ECS, S3" with "Cognito, S3" to match `infra/modules/`
3. **P2 (effort: Low)** — Either create the referenced `CONTEXT-MAP.md` + per-layer `CONTEXT.md` files, or remove the "Agent skills → Domain docs" section from root `CLAUDE.md`
4. **P2 (effort: Low)** — Expand `savepoint-tanstack/README.md` beyond the TanStack Start starter template — it currently lacks any project-specific context (the deep operational doc is in `savepoint-tanstack/CLAUDE.md`, but README should at minimum point there)
