# Code Audit Report

**Date:** 2026-05-18
**Scope:** all dimensions
**Overall Score:** 90% — Grade **B** (89.9% precise, one tenth shy of A)
**Previous Audit:** 2026-05-12 — 85% Grade B

## Summary

| #   | Dimension                  | Score | Grade | Delta | Critical | High | Medium | Low |
| --- | -------------------------- | ----- | ----- | ----- | -------- | ---- | ------ | --- |
| 1   | Project Topology           | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 2   | Code Architecture          | 89%   | B     | 0     | 0        | 1    | 0      | 0   |
| 3   | Documentation Quality      | 86%   | B     | +19   | 0        | 0    | 2      | 0   |
| 4   | AI Development Tooling     | 100%  | A     | +10   | 0        | 0    | 0      | 0   |
| 5   | Prompt & Agent Integrity   | 100%  | A     | +9    | 0        | 0    | 0      | 0   |
| 6   | Quality Assurance          | 85%   | B     | 0     | 1        | 0    | 0      | 1   |
| 7   | Security Guardrails        | 100%  | A     | +12   | 0        | 0    | 0      | 0   |
| 8   | Software Best Practices    | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 9   | Spec-Driven Development    | 93%   | A     | 0     | 0        | 1    | 0      | 0   |
| 10  | Supply Chain Security      | 72%   | C     | +16   | 1        | 1    | 1      | 0   |
| 11  | End-to-End Delivery        | 64%   | C     | -15   | 0        | 1    | 1      | 0   |

> Counts are FAIL+WARN combined per severity. Five dimensions are perfect 100/A; the headline gap is `end-to-end-delivery` (single-layer-branch dominance during the spec 021 side-by-side phase) and `supply-chain-security` (TanStack deps installed within 1–3 days of publish, no quarantine gate).

## Dimension: Project Topology

**Score:** 100% — Grade **A**

| #   | Check                              | Severity | Status | Evidence                                                                                                         |
| --- | ---------------------------------- | -------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| 1   | Repository structure type          | medium   | PASS   | pnpm monorepo + Terraform root.                                                                                  |
| 2   | Application layer inventory        | medium   | PASS   | 3 layers: Next.js 16 app, TanStack Start v1 app, Terraform IaC.                                                  |
| 3   | Database and storage detection     | medium   | PASS   | Prisma in both apps; docker-compose runs Postgres 16, pgAdmin, LocalStack S3.                                    |
| 4   | Infrastructure layer detection     | medium   | PASS   | 14 `*.tf` files under `infra/envs/{dev,prod}` and `infra/modules/{cognito,s3}`.                                  |
| 5   | Language inventory                 | medium   | PASS   | TS dominant (942 .ts + 555 .tsx); 14 HCL; no other languages.                                                    |
| 6   | Inter-layer communication patterns | medium   | PASS   | Intra-app via server actions / `createServerFn`; no GraphQL/gRPC/OpenAPI/MQ.                                     |

## Dimension: Code Architecture

**Score:** 89% — Grade **B**

| #   | Check                                            | Severity | Status | Evidence                                                                                                                                              |
| --- | ------------------------------------------------ | -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Declared/recognizable architectural pattern      | high     | PASS   | FSD declared in both apps + 4-layer DAL in `savepoint-app/data-access-layer/`.                                                                        |
| 2   | Module boundaries respected                      | high     | WARN   | 3 DAL→features schema/lib imports reverse the intended layering (profile-service, igdb-handler, social activity-feed types); widgets→features cross-imports are allow-listed. |
| 3   | SRP — modules well-scoped                        | medium   | PASS   | FSD segments uniformly scoped; no god dirs.                                                                                                           |
| 4   | Separation of concerns across layers             | high     | PASS   | UI never touches Prisma; mutations through `createServerAction` / `createServerFn`.                                                                   |
| 5   | Consistent file/dir naming                       | medium   | PASS   | Uniform kebab-case; 0 PascalCase tsx filenames in features/widgets.                                                                                   |
| 6   | Reasonable file sizes                            | medium   | PASS   | 2.51% of hand-written files exceed 500 LOC (well under 5% threshold); generated Prisma excluded.                                                      |

## Dimension: Documentation Quality

**Score:** 86% — Grade **B**

| #   | Check                              | Severity | Status | Evidence                                                                                                                                             |
| --- | ---------------------------------- | -------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Root README exists and is useful   | critical | PASS   | 66-line root README accurately lists all 3 modules incl. `savepoint-tanstack/`; setup, AWOS commands, pre-commit guidance.                           |
| 2   | Service-level READMEs exist        | high     | PASS   | All 3 service dirs documented; per-layer CLAUDE.md supplements.                                                                                      |
| 3   | API documentation                  | medium   | WARN   | 12 internal Next.js route handlers (incl. Steam OAuth callbacks) with no OpenAPI/Swagger artifact.                                                   |
| 4   | No stale documentation             | medium   | WARN   | Root `CLAUDE.md:146` references `CONTEXT-MAP.md` and per-layer `CONTEXT.md` — none exist; only `docs/agents/domain.md` is present.                   |

## Dimension: AI Development Tooling

**Score:** 100% — Grade **A**

| #   | Check                                                  | Severity | Status | Evidence                                                                                                                                |
| --- | ------------------------------------------------------ | -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | CLAUDE.md ecosystem provides adequate AI context       | critical | PASS   | 29 CLAUDE.md files; per-layer trip-wires, foot-guns, layer rules; all complex modules documented.                                       |
| 2   | Custom slash commands                                  | medium   | PASS   | 10 commands under `.claude/commands/awos/`.                                                                                             |
| 3   | Skills configured                                      | low      | PASS   | 5 skills with `SKILL.md`.                                                                                                               |
| 4   | MCP servers configured                                 | low      | PASS   | 3 servers (`awos-recruitment`, `terraform-mcp-server`, `aws-knowledge-mcp-server`).                                                     |
| 5   | Hooks configured                                       | low      | PASS   | PreToolUse `check-sensitive-files.sh`, PostToolUse `format-and-lint.sh`.                                                                |
| 6   | CLAUDE.md files meaningful and well-structured         | high     | PASS   | All under 200 lines except DAL (224, marginal); content is concrete and non-obvious.                                                    |
| 7   | Agent can run and observe the application              | critical | PASS   | Playwright plugin enabled for both web UIs; `terraform plan` dry-run + terraform-mcp-server for infra.                                  |

## Dimension: Prompt & Agent Integrity

**Score:** 100% — Grade **A**

| #   | Check                                                       | Severity | Status | Evidence                                                                                                                                              |
| --- | ----------------------------------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | No invisible/hidden Unicode in prompt files                 | critical | PASS   | Byte-level scan of 110 prompt files: zero matches.                                                                                                    |
| 2   | No prompt-injection patterns                                | critical | PASS   | All matches are defensive (deny regex, env-read warning) or fenced reference docs quoting official upstream install scripts.                          |
| 3   | Hook scripts contain no suspicious commands                 | critical | PASS   | Both scripts purely defensive (deny + format/lint); `set -euo pipefail`; no `curl`/`wget`/`base64`/`eval`/network.                                    |
| 4   | MCP server configs point to trusted endpoints               | critical | PASS   | All HTTPS or official stdio (HashiCorp image, *.api.aws, Provectus org domain).                                                                       |
| 5   | Agent/configuration files git-tracked                       | high     | PASS   | All `.claude/` configs + hooks tracked; only `.claude/settings.local.json` gitignored (standard per-user).                                             |
| 6   | Skill/command files lack security-bypass content            | critical | PASS   | No `$ARGUMENTS`-into-shell, no hook-bypass, no secret-access patterns.                                                                                |

## Dimension: Quality Assurance

**Score:** 85% — Grade **B**

| #   | Check                                              | Severity | Status | Evidence                                                                                                                                              |
| --- | -------------------------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Test infrastructure with adequate coverage         | critical | WARN   | 250 test files vs ~1497 source — substantial but ratio likely <60%.                                                                                   |
| 2   | Unit tier present                                  | high     | PASS   | Both apps have explicit unit projects; 143 files use `vi.mock`.                                                                                       |
| 3   | Integration tier present                           | high     | PASS   | `*.integration.test.ts` glob in both `vitest.config.ts`; 13 integration files.                                                                        |
| 4   | E2E tier present                                   | high     | PASS   | `playwright.config.ts` + 10 spec files in `savepoint-app/e2e/`.                                                                                       |
| 5   | Pyramid shape — no inversion                       | medium   | PASS   | unit 142 > integration 13 > e2e 10.                                                                                                                   |
| 6   | Coverage reporting configured                      | low      | WARN   | v8 coverage in savepoint-app but no thresholds; savepoint-tanstack has no coverage config.                                                            |
| 7   | Test data management                               | low      | PASS   | `@faker-js/faker` + `test/setup/db-factories/`.                                                                                                       |
| 8   | Test isolation — mocking infrastructure            | medium   | PASS   | `vi.mock` + MSW v2.                                                                                                                                   |
| 9   | Contract testing                                   | high     | SKIP   | Single-app intra-process comms.                                                                                                                       |
| 10  | ML model iteration testing                         | high     | SKIP   | No ML frameworks in repo.                                                                                                                             |

## Dimension: Security Guardrails

**Score:** 100% — Grade **A**

| #   | Check                                            | Severity | Status | Evidence                                                                                                                                              |
| --- | ------------------------------------------------ | -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `.env` files are gitignored                      | critical | PASS   | `.gitignore:44–54` covers `.env*` family; only `.env.example` and `.env.test` (placeholder-only) tracked.                                              |
| 2   | AI agent hooks restrict sensitive reads          | critical | PASS   | `check-sensitive-files.sh` blocks `.env`, certs, credentials, secrets; verified live (blocked `cat .env.test` during this audit).                     |
| 3   | `.env.example` template exists                   | high     | PASS   | Three templates, placeholder values only.                                                                                                             |
| 4   | No secrets in committed files                    | critical | PASS   | Broad regex scan returned only test fixtures + placeholders.                                                                                          |
| 5   | Sensitive file types in `.gitignore`             | high     | PASS   | Stack-relevant coverage: certs, Terraform state/plan/tfvars, OS junk, build dirs; previously-flagged `Thumbs.db` gap closed.                          |

## Dimension: Software Best Practices

**Score:** 100% — Grade **A**

| #   | Check                                              | Severity | Status | Evidence                                                                                                                                              |
| --- | -------------------------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Linting configured and enforced                    | high     | PASS   | ESLint flat config in both apps; `--max-warnings 0`; CI-gated; terraform fmt step.                                                                    |
| 2   | Formatting automated                               | medium   | PASS   | Prettier in both packages + lint-staged + `format-check` job.                                                                                         |
| 3   | Type safety enforced                               | high     | PASS   | Strict + strictNullChecks in both apps; tanstack adds `noImplicitOverride`; CI typecheck gates PRs.                                                   |
| 4   | CI/CD pipeline exists                              | high     | PASS   | 5 workflows: pr-checks, pr-checks-tanstack, e2e, integration, deploy.                                                                                 |
| 5   | Error handling patterns consistent                 | high     | PASS   | Sampled 5 catch blocks: all log via pino + typed throws via `mapErrorToHandlerResult` / `APIError`.                                                   |
| 6   | Dependencies managed                               | medium   | PASS   | `pnpm-lock.yaml` + Dependabot for npm×3 / terraform / github-actions; centralized `pnpm.overrides`.                                                   |

## Dimension: Spec-Driven Development

**Score:** 93% — Grade **A**

| #   | Check                                          | Severity | Status | Evidence                                                                                                                                              |
| --- | ---------------------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | AWOS installed and set up                      | critical | PASS   | `.awos/commands/` + `.claude/commands/awos/` × 10; `context/product/` + `context/spec/`.                                                              |
| 2   | Product context documents complete             | high     | PASS   | product-definition (100 L), roadmap (141 L), architecture (809 L, 9 areas + 9 ADRs).                                                                  |
| 3   | Architecture reflects codebase reality         | high     | WARN   | Compute drift: arch §5 declares ECS Fargate but actual hosting is Vercel (spec 021 cutover); TanStack Start only in arch header.                       |
| 4   | Features implemented through specs             | critical | PASS   | 75% (6/8) recent `feat/` branches touched `context/spec/**`.                                                                                          |
| 5   | Spec directories structurally complete         | high     | PASS   | 18/19 dirs have full triad; only 019 missing tasks.md.                                                                                                |
| 6   | No stale/abandoned specs                       | medium   | PASS   | All non-Draft specs Completed; Drafts actively progressing.                                                                                           |
| 7   | Tasks have meaningful agent assignments        | medium   | PASS   | 18/18 tasks.md files use `**[Agent: name]**`; 1131 annotations; specialist mix incl. dedicated QA agents.                                             |

## Dimension: Supply Chain Security

**Score:** 72% — Grade **C**

| #   | Check                                                       | Severity | Status | Evidence                                                                                                                                              |
| --- | ----------------------------------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Lockfiles committed                                         | critical | PASS   | `pnpm-lock.yaml` at root; `.terraform.lock.hcl` in dev + prod.                                                                                        |
| 2   | Lockfiles contain integrity hashes                          | high     | PASS   | 1338 `integrity: sha512-…` 1:1 with resolutions; HCL provider `h1:` hashes verified.                                                                  |
| 3   | No permissive version ranges                                | high     | WARN   | 7 caret ranges across root + savepoint-app; 3 of those inside `pnpm.overrides` (defeats override intent). Tanstack is fully exact-pinned.             |
| 4   | No recently published deps (quarantine)                     | critical | FAIL   | 4 `@tanstack/*` deps in `savepoint-tanstack` published 1–3 days ago; no `minimumReleaseAge` / quarantine gate.                                        |
| 5   | Dependency review process enforces approval                 | high     | PASS   | Dependabot weekly across 5 ecosystems; no auto-merge; CODEOWNERS gates supply-chain-critical paths.                                                   |
| 6   | Vulnerability scanning in CI                                | critical | PASS   | `pnpm audit --prod --audit-level=high` blocking job in both pr-checks workflows; dev advisories deliberately excluded with documented rationale.      |
| 7   | Dependency overrides reviewed and justified                 | high     | PASS   | 15 root overrides; `DEPENDENCY_DECISIONS.md` with per-package rationale; CODEOWNERS-protected.                                                        |
| 8   | Dependency count and attack surface                         | medium   | FAIL   | ~1427 resolved packages > 1000 JS threshold (parallel-app phase); ratio ~8.7:1 healthy; expected to drop at spec 021 cutover.                         |

## Dimension: End-to-End Delivery

**Score:** 64% — Grade **C**

| #   | Check                                   | Severity | Status | Evidence                                                                                                                                              |
| --- | --------------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Cross-layer feature branches            | high     | FAIL   | Only 3/14 recent non-dependabot branches touched 2+ service dirs (21% < 25% threshold); 11/14 were savepoint-app-only.                                |
| 2   | No layer-split branching pattern        | medium   | PASS   | No `-backend`/`-frontend` paired siblings.                                                                                                            |
| 3   | Spec-to-delivery traceability           | high     | PASS   | Bidirectional: commits embed `(spec NNN slice X)`; spec tasks ticked alongside branch progress.                                                       |
| 4   | No orphaned artifacts                   | medium   | PASS   | Infra outputs (cognito, S3) wired in `savepoint-app/auth.ts` and `avatar-storage.ts`.                                                                 |
| 5   | Shared ownership enablers               | medium   | WARN   | Partial: root `docker-compose` + `pnpm-workspace` span apps, but Makefile is savepoint-only, CI split per-app, infra has no root task entry.          |

## Top Recommendations

| #   | Priority | Effort | Dimension              | Recommendation                                                                                                                                |
| --- | -------- | ------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | P0       | Low    | Supply Chain Security  | Add 7-day quarantine: `minimumReleaseAge: "7 days"` in Renovate, or a CI gate that fails PRs introducing deps published <7d ago.              |
| 2   | P1       | Medium | Quality Assurance      | Wire `coverage.thresholds.lines` (start at 60, ratchet up) in `savepoint-app/vitest.coverage.config.ts`; add coverage config to savepoint-tanstack. |
| 3   | P1       | Medium | End-to-End Delivery    | Promote a unified root `Makefile`/script with `dev`/`test`/`ci`/`infra:plan` targets spanning both apps + infra; consider merging the two `pr-checks*.yml` into one matrix-driven workflow. |
| 4   | P2       | Low    | Documentation          | Fix stale "Domain docs" paragraph in root `CLAUDE.md:146` — either create `CONTEXT-MAP.md` + per-layer `CONTEXT.md`, or delete the paragraph and rely on per-module `CLAUDE.md`. |
| 5   | P2       | Low    | Spec-Driven Dev        | Update `context/product/architecture.md` §5 to replace ECS Fargate with Vercel and document TanStack Start v1 alongside Next.js.              |
| 6   | P2       | Low    | Supply Chain Security  | Replace remaining 7 caret ranges with exact pins (especially the 3 inside `pnpm.overrides` where `^` defeats the override).                   |
| 7   | P2       | Medium | Code Architecture      | Lift the 3 DAL→features types (profile lib, igdb search schemas, social activity-feed types) into `shared/` or DAL-owned schemas to remove reverse-direction imports. |
| 8   | P2       | Low    | Documentation          | Document the 12 internal API route handlers — at minimum a one-page table in `savepoint-app/app/CLAUDE.md` covering Steam OAuth callbacks as external surface. |
| 9   | P2       | Medium | End-to-End Delivery    | Add `infra` root-level task runner entry (e.g. `pnpm infra:plan`) so AI agents can exercise infra without `cd`.                               |
| 10  | P2       | Low    | AI Development Tooling | Trim `data-access-layer/CLAUDE.md` from 224 → ≤200 lines (sub-WARN threshold today, but tighter is friendlier for future agent context windows). |
