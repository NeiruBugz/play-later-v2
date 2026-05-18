# Code Audit Report

**Date:** 2026-05-18
**Scope:** all dimensions
**Overall Score:** 83% — Grade **B**
**Previous Audit:** 2026-05-12 — 85% Grade B

## Summary

| #   | Dimension                  | Score | Grade | Delta | Critical | High | Medium | Low |
| --- | -------------------------- | ----- | ----- | ----- | -------- | ---- | ------ | --- |
| 1   | Project Topology           | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 2   | Code Architecture          | 100%  | A     | +11   | 0        | 0    | 0      | 0   |
| 3   | Documentation Quality      | 42%   | D     | -25   | 1        | 1    | 1      | 0   |
| 4   | AI Development Tooling     | 90%   | A     | 0     | 0        | 1    | 0      | 0   |
| 5   | Prompt & Agent Integrity   | 100%  | A     | +9    | 0        | 0    | 0      | 0   |
| 6   | Quality Assurance          | 96%   | A     | +11   | 0        | 0    | 0      | 1   |
| 7   | Security Guardrails        | 92%   | A     | +4    | 0        | 0    | 1      | 0   |
| 8   | Software Best Practices    | 90%   | A     | -10   | 0        | 1    | 0      | 0   |
| 9   | Spec-Driven Development    | 93%   | A     | 0     | 0        | 1    | 0      | 0   |
| 10  | Supply Chain Security      | 56%   | D     | 0     | 1        | 2    | 1      | 0   |
| 11  | End-to-End Delivery        | 64%   | C     | -15   | 0        | 1    | 1      | 0   |

## Dimension: Project Topology

**Score:** 100% — Grade **A**

All 6 reconnaissance checks PASS. Monorepo (pnpm workspace + Terraform root). Detected layers: `savepoint-app/` (Next.js 15), `savepoint-tanstack/` (TanStack Start, WIP per spec 021), `infra/` (Terraform), `docker-compose.yml` local stack. Storage: PostgreSQL 16 + Prisma (two schemas), S3 (LocalStack). Languages: TypeScript dominant (1,541 files), HCL (14), Prisma (2). Communication: Server Actions, REST route handlers, `createServerFn` (TanStack), AWS SDK.

## Dimension: Code Architecture

**Score:** 100% — Grade **A**

| #   | Check                                       | Severity | Status | Evidence                                                                          |
| --- | ------------------------------------------- | -------- | ------ | --------------------------------------------------------------------------------- |
| 1   | Recognizable architectural pattern declared | high     | PASS   | FSD declared in both apps + `context/product/architecture.md`                     |
| 2   | Layer boundaries respected                  | high     | PASS   | No FSD violations in sampled imports; tanstack enforces via `eslint-plugin-boundaries` |
| 3   | Modules well-scoped (no god dirs)           | medium   | PASS   | No `helpers/`/`common/`/`misc/` god dirs; max 8 files per `shared/lib/` subdir    |
| 4   | Separation of concerns inside layers        | medium   | PASS   | DAL handler→service→repository→domain; UI has no inline SQL/fetch                 |
| 5   | Consistent naming                           | low      | PASS   | kebab-case throughout; tests colocated with `.test.tsx`/`.unit.test.ts` suffixes  |
| 6   | File-size discipline                        | medium   | PASS   | 2.8% of source files >500 LOC (under 5% threshold); largest hand-written: 841 LOC |

The prior FSD violation (4 files importing `@/widgets/game-card` from features) was resolved since 2026-05-12.

## Dimension: Documentation Quality

**Score:** 42% — Grade **D**

| #   | Check                              | Severity | Status | Evidence                                                                              |
| --- | ---------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------- |
| 1   | Root README accurate & complete    | critical | WARN   | `README.md` claims infra provisions RDS/ECS (retired); only `cognito` + `s3` exist; omits `savepoint-tanstack/` |
| 2   | Service/module READMEs present     | high     | WARN   | `savepoint-tanstack/README.md` is unmodified TanStack Start scaffold, no project context |
| 3   | API/interface contracts documented | high     | SKIP   | Internal-only Server Actions/route handlers/`createServerFn` — no external API surface |
| 4   | No stale or contradictory claims   | medium   | FAIL   | 3/5 sampled claims inaccurate (RDS/ECS, missing tanstack, boilerplate tanstack README) |

Stale RDS/ECS claims first flagged 2026-04-28 still present 3 weeks later. Root `CLAUDE.md` is accurate; `README.md` lags.

## Dimension: AI Development Tooling

**Score:** 90% — Grade **A**

| #   | Check                                | Severity | Status | Evidence                                                                                 |
| --- | ------------------------------------ | -------- | ------ | ---------------------------------------------------------------------------------------- |
| 1   | CLAUDE.md present at root            | critical | PASS   | Root + 28 nested CLAUDE.md files                                                          |
| 2   | Per-layer CLAUDE.md coverage         | high     | PASS   | App-router, features, widgets, DAL sublayer coverage                                      |
| 3   | Custom commands defined              | medium   | PASS   | 10 AWOS slash commands                                                                    |
| 4   | Skills with SKILL.md                 | low      | PASS   | 5 valid skills (with 5 symlinks to `.agents/skills/`)                                     |
| 5   | MCP servers configured               | low      | PASS   | 3 MCP servers in `.mcp.json` + Playwright plugin                                          |
| 6   | CLAUDE.md size discipline (≤200 LOC) | high     | WARN   | `savepoint-tanstack/CLAUDE.md` (512), `savepoint-app/data-access-layer/CLAUDE.md` (224)   |
| 7   | Browser/CLI observation tooling      | critical | PASS   | Playwright plugin for web; Terraform plan dry-run                                          |

## Dimension: Prompt & Agent Integrity

**Score:** 100% — Grade **A**

| #   | Check                                          | Severity | Status | Evidence                                                              |
| --- | ---------------------------------------------- | -------- | ------ | --------------------------------------------------------------------- |
| 1   | No invisible Unicode in agent/skill/cmd files  | critical | PASS   | 106 files byte-scanned, zero invisible/RTL/tag-block characters       |
| 2   | No prompt-injection patterns                   | critical | PASS   | Only matches are documentation/defensive snippets                     |
| 3   | No security-bypass language                    | critical | PASS   | Hooks contain only defensive filename allow/deny + lint scoping       |
| 4   | MCP servers come from reputable sources         | critical | PASS   | All 3 servers (provectus, hashicorp, AWS official) verified           |
| 5   | All prompt/hook files git-tracked              | medium   | PASS   | 5 apparent gaps are symlinks to tracked `.agents/skills/` targets     |
| 6   | No `$ARGUMENTS` injection surface              | high     | PASS   | No shell-interpolation patterns in command files                      |

The 2026-05-12 WARN on `aws-knowledge-mcp-server` was re-investigated — it points at official `knowledge-mcp.global.api.aws`, now PASS.

## Dimension: Quality Assurance

**Score:** 96% — Grade **A**

| #   | Check                       | Severity | Status | Evidence                                                                       |
| --- | --------------------------- | -------- | ------ | ------------------------------------------------------------------------------ |
| 1   | Test framework configured   | critical | PASS   | Vitest multi-project (utilities/components/backend/integration) + Playwright   |
| 2   | Unit tests present          | high     | PASS   | ~165 unit/component files                                                       |
| 3   | Integration tests present   | high     | PASS   | 49 integration files                                                            |
| 4   | E2E tests present           | medium   | PASS   | 10 Playwright specs                                                             |
| 5   | Mocking discipline          | medium   | PASS   | 162 files using `vi.mock`/`vi.fn`; MSW for HTTP                                 |
| 6   | Coverage configured         | low      | WARN   | `savepoint-app/vitest.coverage.config.ts` lacks `thresholds`; tanstack has none |
| 7   | Test data factories         | medium   | PASS   | `savepoint-app/test/fixtures/` + `@faker-js/faker`                              |
| 8   | Test pyramid shape          | medium   | PASS   | Healthy 165→49→10 unit→integration→E2E ratio                                    |
| 9   | Contract testing            | high     | SKIP   | No inter-service runtime comms                                                  |
| 10  | ML testing                  | medium   | SKIP   | No ML frameworks                                                                |

## Dimension: Security Guardrails

**Score:** 92% — Grade **A**

| #   | Check                              | Severity | Status | Evidence                                                              |
| --- | ---------------------------------- | -------- | ------ | --------------------------------------------------------------------- |
| 1   | `.env*` files gitignored           | critical | PASS   | All variants gitignored except `.env.example`                         |
| 2   | AI hooks restrict secret reads     | critical | PASS   | `check-sensitive-files.sh` blocks `.env.*` reads (verified empirically)|
| 3   | `.env.example` present              | high     | PASS   | 3 templates with placeholder values only                              |
| 4   | No committed secrets               | critical | PASS   | No `.env*`/credential files in git history                            |
| 5   | gitignore stack coverage           | medium   | WARN   | Missing `Thumbs.db` (universal OS file)                               |

## Dimension: Software Best Practices

**Score:** 90% — Grade **A**

| #   | Check          | Severity | Status | Evidence                                                              |
| --- | -------------- | -------- | ------ | --------------------------------------------------------------------- |
| 1   | Linting        | high     | WARN   | ESLint covers both JS packages; no `terraform fmt -check`/tflint in CI |
| 2   | Formatting     | medium   | PASS   | Prettier + CI `format-check`                                          |
| 3   | Type safety    | high     | PASS   | `strict: true` in both tsconfigs                                      |
| 4   | CI/CD          | high     | PASS   | 5 GitHub Actions workflows                                            |
| 5   | Error handling | medium   | PASS   | Pino logging; typed-throw DAL; no silent swallowing                   |
| 6   | Dependencies   | medium   | PASS   | `pnpm-lock.yaml` + Dependabot (npm + terraform)                       |

Regression from 100% in 2026-05-12: SBP-01 WARN reintroduced because no HCL linting in CI.

## Dimension: Spec-Driven Development

**Score:** 93% — Grade **A**

| #   | Check                          | Severity | Status | Evidence                                                                |
| --- | ------------------------------ | -------- | ------ | ----------------------------------------------------------------------- |
| 1   | AWOS installed                  | critical | PASS   | 10 commands + Claude wrappers + product/spec dirs                       |
| 2   | Product context docs           | critical | PASS   | All 3 docs substantive (100/141/807 LOC)                                |
| 3   | Architecture doc complete       | high     | WARN   | `architecture.md` omits TanStack Start as active migration target       |
| 4   | Feature branches reference specs| medium   | PASS   | 6/8 recent `feat/*` branches touched spec files (75%)                   |
| 5   | Spec triad completeness         | medium   | PASS   | 90% triad completeness; 019 missing tasks.md                            |
| 6   | No stale specs                  | medium   | PASS   | 005 missing Status field; no zombie specs                               |
| 7   | Task agent annotations          | medium   | PASS   | 92% of sub-tasks carry agent annotations; healthy specialist mix        |

## Dimension: Supply Chain Security

**Score:** 56% — Grade **D**

| #   | Check                        | Severity | Status | Evidence                                                              |
| --- | ---------------------------- | -------- | ------ | --------------------------------------------------------------------- |
| 1   | Lockfiles tracked            | critical | PASS   | `pnpm-lock.yaml` committed at root                                    |
| 2   | Integrity hashes             | high     | PASS   | All lockfile entries have integrity hashes                            |
| 3   | No permissive ranges         | high     | WARN   | 4 caret deps in savepoint-app + 1 root devDep                         |
| 4   | Quarantine (>7d publish age) | critical | PASS   | Oldest sampled gap 15 days; all deps clear 7-day window               |
| 5   | Review enforcement           | high     | WARN   | Dependabot missing `/savepoint-tanstack`; no CODEOWNERS file          |
| 6   | CI vulnerability scanning    | critical | FAIL   | Zero `pnpm audit`/dependency-review across all 5 workflows            |
| 7   | Overrides justified          | high     | FAIL   | `rollup: '>=4.59.0'`, `fast-xml-parser: '>=5.3.8'` open-ended; 16 overrides undocumented |
| 8   | Attack surface (pkg count)   | medium   | FAIL   | 1,332 resolved packages > 1,000 threshold (inflated by parallel-app migration) |

Flat vs 2026-05-12 (56%). Adding `pnpm audit` to CI alone would lift this to ~B-grade.

## Dimension: End-to-End Delivery

**Score:** 64% — Grade **C**

| #   | Check                                  | Severity | Status | Evidence                                                              |
| --- | -------------------------------------- | -------- | ------ | --------------------------------------------------------------------- |
| 1   | Cross-layer feature delivery rate       | high     | FAIL   | 21% (3/14) recent branches touch multiple layers                      |
| 2   | No layer-split branch pairs            | medium   | PASS   | Cross-layer changes stay in single branches per CLAUDE.md rule         |
| 3   | Spec↔branch traceability                | high     | PASS   | `(spec NNN slice X)` commit footers + tasks.md ticks bidirectional    |
| 4   | No orphaned artifacts                   | medium   | PASS   | Terraform outputs consumed in app code                                |
| 5   | Unified task runner across layers       | medium   | WARN   | Root docker-compose + pnpm-workspace, but Makefile savepoint-only; CI split |

Capability exists (spec 021 TanStack migration proves it) but cross-layer slices aren't routine — most feature work stays inside `savepoint-app/`.

## Top Recommendations

| #   | Priority | Effort | Dimension                | Recommendation                                                                 |
| --- | -------- | ------ | ------------------------ | ------------------------------------------------------------------------------ |
| 1   | P0       | Low    | Supply Chain Security    | Add `pnpm audit --audit-level=high` (or `actions/dependency-review-action@v4`) to `pr-checks.yml` |
| 2   | P1       | Low    | Documentation            | Fix `README.md` stale RDS/ECS claims; mention `savepoint-tanstack/` (3rd time flagged) |
| 3   | P1       | Low    | Supply Chain Security    | Replace `rollup: '>=4.59.0'` and `fast-xml-parser: '>=5.3.8'` with exact pins; add `DEPENDENCY_DECISIONS.md` |
| 4   | P1       | Low    | Supply Chain Security    | Add `/savepoint-tanstack` to `.github/dependabot.yml` + create minimal `CODEOWNERS` |
| 5   | P1       | Medium | Documentation            | Replace boilerplate `savepoint-tanstack/README.md` with project-specific content |
| 6   | P1       | Low    | Spec-Driven Development  | Update `context/product/architecture.md` to mention TanStack Start as active migration target |
| 7   | P1       | Medium | AI Development Tooling   | Split `savepoint-tanstack/CLAUDE.md` (512 LOC) into focused sub-files (≤200 LOC) |
| 8   | P1       | Low    | Software Best Practices  | Add `terraform fmt -check` (and optionally tflint) to `pr-checks.yml`         |
| 9   | P2       | Medium | End-to-End Delivery      | Add a unified root `Makefile` (or `pnpm` task) covering both apps + infra      |
| 10  | P2       | Low    | Security Guardrails      | Add `Thumbs.db` to root `.gitignore`                                          |
