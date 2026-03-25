# Code Audit Report

**Date:** 2026-03-25
**Scope:** all dimensions
**Overall Score:** 73% — Grade **C**
**Previous Audit:** none

## Summary

| # | Dimension | Score | Grade | Delta | Critical | High | Medium | Low |
|---|-----------|-------|-------|-------|----------|------|--------|-----|
| 1 | Project Topology | 100% | A | — | 0 | 0 | 0 | 0 |
| 2 | AI Development Tooling | 33% | F | — | 2 | 1 | 0 | 1 |
| 3 | Code Architecture | 67% | C | — | 0 | 2 | 1 | 0 |
| 4 | Documentation Quality | 83% | B | — | 0 | 0 | 1 | 0 |
| 5 | Security Guardrails | 69% | C | — | 1 | 1 | 0 | 0 |
| 6 | Software Best Practices | 96% | A | — | 0 | 0 | 1 | 0 |
| 7 | Spec-Driven Development | 82% | B | — | 1 | 1 | 0 | 0 |
| 8 | End-to-End Delivery | 50% | D | — | 0 | 2 | 1 | 0 |

## Dimension: Project Topology

**Score:** 100% — Grade **A**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| TOPO-01 | Repository structure type | medium | PASS | Monorepo via pnpm workspaces; 3 roots: savepoint-app, lambdas-py, infra |
| TOPO-02 | Application layer inventory | medium | PASS | 3 layers: Next.js web app, Python Lambdas, Terraform IaC |
| TOPO-03 | Database and storage detection | medium | PASS | PostgreSQL 16.6 (Prisma), AWS S3, LocalStack |
| TOPO-04 | Infrastructure layer detection | medium | PASS | Terraform (29 .tf files, 7 modules, 2 envs), docker-compose |
| TOPO-05 | Language inventory | medium | PASS | TypeScript (602), SQL (46), Python (38), HCL (29), JS (6), CSS (1) |
| TOPO-06 | Inter-layer communication | medium | PASS | AWS SQS (app->Lambda), AWS S3 (shared storage) |

## Dimension: AI Development Tooling

**Score:** 33% — Grade **F**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| AI-01 | CLAUDE.md ecosystem context | critical | WARN | savepoint-app well-covered (9 module files); lambdas-py/ and infra/ have zero AI context; root CLAUDE.md deleted on working tree |
| AI-02 | Custom slash commands | medium | PASS | 9 AWOS commands in .claude/commands/awos/ |
| AI-03 | Skills configured | low | PASS | 3 skills: frontend-design, react-best-practices, react-feature-sliced-design |
| AI-04 | MCP servers configured | low | PASS | 1 server in .mcp.json (awos-recruitment) |
| AI-05 | Hooks configured | low | FAIL | No hooks in .claude/settings.json |
| AI-06 | CLAUDE.md quality | high | FAIL | 5/9 files exceed 200 lines (up to 345); extensive directory trees, code templates, tutorial prose; root copy is 899 lines |
| AI-07 | Agent can run and observe app | critical | FAIL | No browser MCP for Next.js UI; no local invoke for Lambda; no plan/diff MCP for Terraform |

## Dimension: Code Architecture

**Score:** 67% — Grade **C**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| ARCH-01 | Declared architectural pattern | high | PASS | FSD + layered DAL explicitly documented |
| ARCH-02 | Module boundaries respected | high | WARN | DAL handlers import from features layer (reverse dep); game-search imports manage-library-entry undocumented |
| ARCH-03 | Single Responsibility | medium | PASS | All 13 feature modules focused with descriptive names |
| ARCH-04 | Separation of concerns | high | WARN | 5 steam-import files import @prisma/client directly; 2 use-cases bypass service layer to access repository |
| ARCH-05 | Consistent naming | medium | PASS | Consistent kebab-case (TS) and snake_case (Python) |
| ARCH-06 | Reasonable file sizes | medium | FAIL | igdb-service.unit.test.ts at 3260 lines exceeds 2000-line limit |

## Dimension: Documentation Quality

**Score:** 83% — Grade **B**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| DOC-01 | Root README useful | critical | PASS | Setup instructions present (pnpm install, pnpm dev) |
| DOC-02 | Service-level READMEs | high | PASS | All 3 service dirs have READMEs |
| DOC-03 | API documentation | high | SKIP | Small internal API with co-located client |
| DOC-04 | No stale documentation | medium | FAIL | 3/5 sampled claims inaccurate: missing lambdas-py from root README, nonexistent feature dirs in structure, Bun referenced instead of pnpm |

## Dimension: Security Guardrails

**Score:** 69% — Grade **C**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| SEC-01 | .env files gitignored | critical | PASS | .env patterns in .gitignore; tracked .env files are examples/test only |
| SEC-02 | AI agent hooks restrict sensitive files | critical | FAIL | No PreToolUse hooks blocking .env, *.pem, *.key access |
| SEC-03 | .env.example exists | high | PASS | Templates at root and both service dirs with placeholders |
| SEC-04 | No secrets in committed files | critical | PASS | Only test fixtures found |
| SEC-05 | Sensitive files in .gitignore | high | WARN | *.key pattern missing from all .gitignore files |

## Dimension: Software Best Practices

**Score:** 96% — Grade **A**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| SBP-01 | Linting configured | high | PASS | ESLint + ruff with CI enforcement |
| SBP-02 | Formatting automated | medium | PASS | Prettier + ruff with CI format-check |
| SBP-03 | Type safety enforced | high | PASS | strict: true in both TS and Python (mypy) |
| SBP-04 | Test infrastructure | critical | PASS | 107 test files (Vitest + Playwright + pytest) |
| SBP-05 | CI/CD pipeline | high | PASS | 4 GitHub Actions workflows covering lint, test, deploy |
| SBP-06 | Error handling consistent | high | PASS | Result pattern throughout; global error handlers; pino logging |
| SBP-07 | Dependencies managed | medium | WARN | Lock files present; no Dependabot/Renovate configured |

## Dimension: Spec-Driven Development

**Score:** 82% — Grade **B**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| SDD-01 | AWOS installed | critical | PASS | 9 commands, 6 templates, context dirs present |
| SDD-02 | Product context complete | high | PASS | product-definition, roadmap, architecture all substantive |
| SDD-03 | Architecture reflects reality | high | WARN | Database schema section lists stale status values vs actual enums |
| SDD-04 | Features via specs | critical | WARN | 2/4 features (50%) have specs in context/spec/; library-status-redesign in docs/superpowers/, auth migration has none |
| SDD-05 | Spec directories complete | high | PASS | 2/2 specs have full triad (functional-spec, tech, tasks) |
| SDD-06 | No stale specs | medium | PASS | All specs show completion progress |
| SDD-07 | Agent assignments | medium | PASS | 100% annotated (84/84 sub-tasks) with domain-appropriate agents |

## Dimension: End-to-End Delivery

**Score:** 50% — Grade **D**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| E2E-01 | Cross-layer feature branches | high | FAIL | ~20% of branches touch 2+ service dirs (below 25% threshold) |
| E2E-02 | No layer-split branching | medium | PASS | No -backend/-frontend branch pairs |
| E2E-03 | Spec-to-delivery traceability | high | WARN | Tasks checked off correlate with PRs but no bidirectional references |
| E2E-04 | No orphaned artifacts | medium | PASS | All layers connected via deploy pipeline and SQS bridge |
| E2E-05 | Shared ownership enablers | medium | WARN | docker-compose + deploy pipeline exist; no root task runner, PR checks only cover savepoint-app |

## Top Recommendations

| # | Priority | Effort | Dimension | Recommendation |
|---|----------|--------|-----------|----------------|
| 1 | P0 | Low | AI Development Tooling | Add browser MCP (Playwright) to .mcp.json so agent can verify Next.js UI changes |
| 2 | P0 | Low | Security Guardrails | Add PreToolUse hooks in .claude/settings.json to block AI access to .env, *.pem, *.key files |
| 3 | P1 | Medium | AI Development Tooling | Trim all CLAUDE.md files to <200 lines — remove directory trees, code templates, and tutorial prose |
| 4 | P1 | Low | AI Development Tooling | Add CLAUDE.md files for lambdas-py/ and infra/ with project purpose and key commands |
| 5 | P1 | Low | Spec-Driven Development | Place all new feature specs in context/spec/ using AWOS workflow (not docs/superpowers/) |
| 6 | P1 | Medium | End-to-End Delivery | Include lambdas-py and infra changes in feature branches when features span layers |
| 7 | P2 | Low | Code Architecture | Split igdb-service.unit.test.ts (3260 lines) into focused test suites |
| 8 | P2 | Low | Documentation Quality | Fix stale README claims: add lambdas-py to root README, update feature dirs, replace Bun refs with pnpm |
| 9 | P2 | Medium | Code Architecture | Fix DAL->features reverse imports and remove @prisma/client from feature layer |
| 10 | P2 | Low | Security Guardrails | Add *.key to .gitignore |
