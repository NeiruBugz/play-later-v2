# Code Audit Report

**Date:** 2026-05-12
**Scope:** all dimensions
**Overall Score:** 85% — Grade **B**
**Previous Audit:** 2026-04-28 — 93% Grade A

## Summary

| #   | Dimension                  | Score | Grade | Delta | Critical | High | Medium | Low |
| --- | -------------------------- | ----- | ----- | ----- | -------- | ---- | ------ | --- |
| 1   | Project Topology           | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 2   | Code Architecture          | 89%   | B     | +1    | 0        | 1    | 0      | 0   |
| 3   | Documentation Quality      | 67%   | C     | -8    | 1        | 0    | 1      | 0   |
| 4   | AI Development Tooling     | 90%   | A     | -10   | 0        | 1    | 0      | 0   |
| 5   | Prompt & Agent Integrity   | 91%   | A     | new   | 1        | 0    | 0      | 0   |
| 6   | Quality Assurance          | 85%   | B     | 0     | 1        | 0    | 0      | 1   |
| 7   | Security Guardrails        | 88%   | B     | -12   | 0        | 0    | 1      | 0   |
| 8   | Software Best Practices    | 100%  | A     | +5    | 0        | 0    | 0      | 0   |
| 9   | Spec-Driven Development    | 93%   | A     | -3    | 0        | 1    | 0      | 0   |
| 10  | Supply Chain Security      | 56%   | D     | new   | 1        | 3    | 1      | 0   |
| 11  | End-to-End Delivery        | 79%   | B     | -21   | 0        | 1    | 1      | 0   |

## Dimension: Project Topology

**Score:** 100% — Grade **A**

All 6 reconnaissance checks PASS. Monorepo with 3 build roots (savepoint-app, savepoint-tanstack, infra). pnpm 10.11.0 workspace covers JS; Terraform is a separate root. TypeScript dominant (~1,476 .ts/.tsx). AWOS installed; Claude config layered. See `project-topology.md` for full topology summary.

## Dimension: Code Architecture

**Score:** 89% — Grade **B**

| #   | Check                                       | Severity | Status | Evidence                                                                                  |
| --- | ------------------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------- |
| 1   | Recognizable architectural pattern declared | high     | PASS   | FSD in both apps; Clean Architecture inside DAL                                           |
| 2   | Layer boundaries respected                  | high     | WARN   | 4 files in savepoint-app import `@/widgets/game-card` from features layer (FSD violation) |
| 3   | Modules well-scoped (no god dirs)           | medium   | PASS   | No directory exceeds size thresholds                                                       |
| 4   | Separation of concerns inside layers        | medium   | PASS   | UI/hooks/server-actions/lib split; DAL handlers→services→repository                       |
| 5   | Consistent naming                           | low      | PASS   | kebab-case throughout                                                                      |
| 6   | File-size discipline                        | medium   | PASS   | 0.5% over 500 LOC (excluding generated Prisma models)                                      |

## Dimension: Documentation Quality

**Score:** 67% — Grade **C**

| #   | Check                              | Severity | Status | Evidence                                                                              |
| --- | ---------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------- |
| 1   | Root README accurate & complete    | critical | WARN   | `README.md:10` and `CLAUDE.md:12` still claim retired RDS/ECS infra (flagged in April) |
| 2   | Service/module READMEs present     | high     | PASS   | All 3 service dirs documented                                                          |
| 3   | API/interface contracts documented | high     | SKIP   | Internal-only RPC; no external API surface                                             |
| 4   | No stale or contradictory claims   | medium   | FAIL   | 6 stale claims sampled (CONTEXT-MAP.md/CONTEXT.md referenced but absent; missing `savepoint-tanstack/` mention) |

## Dimension: AI Development Tooling

**Score:** 90% — Grade **A**

| #   | Check                                | Severity | Status | Evidence                                                                                 |
| --- | ------------------------------------ | -------- | ------ | ---------------------------------------------------------------------------------------- |
| 1   | CLAUDE.md present at root            | critical | PASS   | Root + 27 nested CLAUDE.md files                                                          |
| 2   | Per-layer CLAUDE.md coverage         | high     | PASS   | Layered (app/feature/widget/sublayer)                                                     |
| 3   | Custom commands defined              | medium   | PASS   | 10 AWOS slash commands                                                                    |
| 4   | Skills with SKILL.md                 | medium   | PASS   | 5 valid skills                                                                            |
| 5   | MCP servers configured               | medium   | PASS   | 3 MCP servers + Playwright plugin                                                         |
| 6   | CLAUDE.md size discipline (≤200 LOC) | high     | WARN   | `savepoint-tanstack/CLAUDE.md` (484 LOC), `savepoint-app/data-access-layer/CLAUDE.md` (224) |

## Dimension: Prompt & Agent Integrity

**Score:** 91% — Grade **A**

| #   | Check                                          | Severity | Status | Evidence                                                                          |
| --- | ---------------------------------------------- | -------- | ------ | --------------------------------------------------------------------------------- |
| 1   | No invisible Unicode in agent/skill/cmd files  | critical | PASS   | 98 files scanned, zero invisible characters                                       |
| 2   | No prompt-injection patterns                   | critical | PASS   | No "ignore previous instructions" / role hijack patterns                          |
| 3   | No security-bypass language in agent prompts   | critical | PASS   | No bypass/exfiltration language                                                   |
| 4   | MCP servers come from reputable sources         | critical | WARN   | `aws-knowledge-mcp-server` uses generic `uvx fastmcp` with remote URL — AWS-owned but non-standard shape |
| 5   | No `$ARGUMENTS` injection surface              | high     | PASS   | No untrusted interpolation in custom commands                                     |
| 6   | All prompt/hook files git-tracked              | medium   | PASS   | Hooks reviewed, local-only, no network calls                                       |

## Dimension: Quality Assurance

**Score:** 85% — Grade **B**

| #   | Check                                | Severity | Status | Evidence                                                          |
| --- | ------------------------------------ | -------- | ------ | ----------------------------------------------------------------- |
| 1   | Healthy unit-test linkage (>60%)     | critical | WARN   | ~22% test-to-source linkage (250 tests vs ~1,142 source files)    |
| 2   | Unit tier present                    | high     | PASS   | Vitest in both JS apps                                            |
| 3   | Integration tier present             | high     | PASS   | Integration tests co-located in DAL                               |
| 4   | E2E tier present                     | high     | PASS   | Playwright in savepoint-app                                       |
| 5   | Pyramid shape healthy (not inverted) | medium   | PASS   | Unit-heavy                                                        |
| 6   | Coverage thresholds gate CI          | low      | WARN   | `vitest.coverage.config.ts` has no `thresholds`; tanstack has none |
| 7   | Fixtures/factories/MSW infra         | medium   | PASS   | faker + msw + structured fixtures; 153 files with `vi.mock`       |
| 8   | Mocking infrastructure mature        | medium   | PASS   | Consistent mocking patterns                                       |
| 9   | Contract testing (multi-service)     | medium   | SKIP   | Single-repo, no inter-service contracts                            |
| 10  | ML iteration testing                 | medium   | SKIP   | No ML layer                                                       |

## Dimension: Security Guardrails

**Score:** 88% — Grade **B**

| #   | Check                                  | Severity | Status | Evidence                                                          |
| --- | -------------------------------------- | -------- | ------ | ----------------------------------------------------------------- |
| 1   | `.env*` files gitignored               | critical | WARN   | `savepoint-app/.env.test` tracked (placeholders only, but non-template name) |
| 2   | AI agent hooks restrict sensitive reads | critical | PASS   | PreToolUse hook with exit-2 blocks                                |
| 3   | `.env.example` template present        | high     | PASS   | 3 templates with placeholders                                     |
| 4   | No secrets in committed files          | critical | PASS   | No real credentials found                                         |
| 5   | Stack-relevant .gitignore              | medium   | PASS   | Next.js, Vite, Prisma, Terraform, macOS, keys/certs all covered   |

## Dimension: Software Best Practices

**Score:** 100% — Grade **A**

All 6 checks PASS (lint, format, type-safety, CI/CD, error handling, deps). Zero `: any` in feature/DAL/shared/tanstack layers. Consistent `logger.error({...ctx}, msg)` then re-throw pattern. Husky pre-commit→lint-staged still unwired but CI gates compensate (optional P2).

## Dimension: Spec-Driven Development

**Score:** 93% — Grade **A**

| #   | Check                                          | Severity | Status | Evidence                                                                                                 |
| --- | ---------------------------------------------- | -------- | ------ | -------------------------------------------------------------------------------------------------------- |
| 1   | AWOS installed                                 | critical | PASS   | 10 commands + wrappers                                                                                    |
| 2   | Product/roadmap/architecture present           | high     | PASS   | All 3 substantive                                                                                         |
| 3   | Architecture reflects current codebase         | high     | WARN   | `architecture.md` omits `savepoint-tanstack/` and lists ECS/RDS/ALB/VPC stack that `infra/` doesn't ship  |
| 4   | Feat branches reference specs                  | critical | PASS   | 6/8 (75%) recent branches touched spec files                                                              |
| 5   | Spec dirs complete                             | high     | PASS   | 18/20 (90%) complete; spec 019 missing tasks.md                                                            |
| 6   | No stale Approved/In-Review specs              | medium   | PASS   | Soft signal only on spec 019                                                                              |
| 7   | Tasks annotated with agent assignments         | medium   | PASS   | 1,031 annotations across 18 tasks.md (~98%)                                                               |

## Dimension: Supply Chain Security

**Score:** 56% — Grade **D**

| #   | Check                                    | Severity | Status | Evidence                                                                                  |
| --- | ---------------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------- |
| 1   | Lockfile committed                       | critical | PASS   | `pnpm-lock.yaml` committed                                                                |
| 2   | Lockfile integrity hashes                | high     | PASS   | SHA-512 on all 1,332 registry entries                                                     |
| 3   | Exact version pinning policy             | high     | WARN   | 5 caret-range deps remain across manifests (violates project policy)                       |
| 4   | Quarantine period for new deps           | medium   | PASS   | 21/21 sampled direct deps published ≥ 9 days ago                                          |
| 5   | Dependabot covers all package roots      | high     | WARN   | Only `/savepoint-app` + `/infra`; missing `/savepoint-tanstack`. No CODEOWNERS.            |
| 6   | Vulnerability scanning in CI             | critical | FAIL   | Zero scanning across 5 workflows — no `pnpm audit`, dependency-review-action, Snyk/Trivy  |
| 7   | Override discipline                      | high     | FAIL   | 14 `pnpm.overrides` (above 10-pkg threshold); 2 use open-ended `>=` ranges; no justification |
| 8   | Dependency bloat                         | medium   | FAIL   | 2,321 lockfile entries (above 1,000 JS threshold) — inflated by parallel app workspaces    |

## Dimension: End-to-End Delivery

**Score:** 79% — Grade **B**

| #   | Check                                          | Severity | Status | Evidence                                                          |
| --- | ---------------------------------------------- | -------- | ------ | ----------------------------------------------------------------- |
| 1   | Recent feat branches cross layers              | high     | WARN   | 3/9 (33%) recent branches touch multiple layers — in Warn band     |
| 2   | No layer-split branch pattern                  | high     | PASS   | No `*-backend`/`*-frontend` pairs                                  |
| 3   | Spec-to-delivery traceability                  | high     | PASS   | Bidirectional; commits reference spec IDs                          |
| 4   | No orphaned artifacts                          | medium   | PASS   | No contract surface to orphan; Prisma + infra modules consumed     |
| 5   | Shared-ownership enablers (root scripts/Make)  | medium   | WARN   | Makefile only targets savepoint-app; root `package.json` empty; CI split per app |

## Top Recommendations

| #   | Priority | Effort | Dimension                | Recommendation                                                                                                |
| --- | -------- | ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1   | P0       | Low    | Supply Chain Security    | Add `pnpm audit --prod` step (or `dependency-review-action`) to `pr-checks.yml`                              |
| 2   | P1       | Low    | Documentation Quality    | Update `README.md:10` and `CLAUDE.md:12` — remove retired RDS/ECS claims; add `savepoint-tanstack/` reference  |
| 3   | P1       | Low    | Security Guardrails      | Rename `savepoint-app/.env.test` to `.env.test.example` (template-naming convention)                          |
| 4   | P1       | Low    | Supply Chain Security    | Add `/savepoint-tanstack` package-ecosystem entry to `.github/dependabot.yml`; create `CODEOWNERS`            |
| 5   | P1       | Medium | Supply Chain Security    | Tighten 2 open-ended `>=` overrides in `pnpm.overrides` to exact versions; document each override rationale  |
| 6   | P1       | Low    | Code Architecture        | Move `widgets/game-card` into a shared/entity layer (or duplicate per feature) to fix 4 FSD violations         |
| 7   | P1       | Medium | Spec-Driven Development  | Update `context/product/architecture.md` to include `savepoint-tanstack/` and clarify ECS/RDS as forward-looking |
| 8   | P1       | High   | Quality Assurance        | Raise test-to-source linkage from ~22% toward 60% — prioritize DAL services and feature use-cases             |
| 9   | P2       | Low    | Quality Assurance        | Add `coverage.thresholds` block in `savepoint-app/vitest.coverage.config.ts`                                  |
| 10  | P2       | Medium | AI Development Tooling   | Split `savepoint-tanstack/CLAUDE.md` (484 LOC) into focused per-area files                                    |
