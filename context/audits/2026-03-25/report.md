# Code Audit Report

**Date:** 2026-03-25
**Scope:** all dimensions
**Overall Score:** 77% — Grade **B**
**Previous Audit:** 2026-03-25 (prior run) — 73% Grade C

## Summary

| # | Dimension | Score | Grade | Delta | Critical | High | Medium | Low |
|---|-----------|-------|-------|-------|----------|------|--------|-----|
| 1 | Project Topology | 100% | A | 0 | 0 | 0 | 0 | 0 |
| 2 | Code Architecture | 89% | B | +22 | 0 | 1 | 0 | 0 |
| 3 | Documentation Quality | 75% | B | -8 | 0 | 1 | 1 | 0 |
| 4 | AI Development Tooling | 48% | D | +15 | 2 | 1 | 0 | 0 |
| 5 | Security Guardrails | 69% | C | 0 | 2 | 1 | 0 | 0 |
| 6 | Software Best Practices | 100% | A | +4 | 0 | 0 | 0 | 0 |
| 7 | Spec-Driven Development | 82% | B | 0 | 1 | 1 | 0 | 0 |
| 8 | End-to-End Delivery | 50% | D | 0 | 0 | 2 | 1 | 0 |

## Dimension: Project Topology

**Score:** 100% — Grade **A**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| TOPO-01 | Repository structure type | medium | PASS | Monorepo via pnpm workspaces; 2 independent build roots: savepoint-app (pnpm/Node), lambdas-py (uv/Python) |
| TOPO-02 | Application layer inventory | medium | PASS | 4 layers: Next.js web app, Python Lambda workers, Terraform IaC, shell scripts |
| TOPO-03 | Database and storage detection | medium | PASS | PostgreSQL 16.6 (Prisma + SQLAlchemy), AWS S3, LocalStack |
| TOPO-04 | Infrastructure layer detection | medium | PASS | Terraform (29 .tf files, 7 modules, 2 envs), docker-compose |
| TOPO-05 | Language inventory | medium | PASS | TypeScript/JS (593), SQL (46), Python (38), HCL (29), CSS (1), Shell (1) |
| TOPO-06 | Inter-layer communication | medium | PASS | AWS SQS (app→Lambda), S3 CSV (inter-lambda), shared PostgreSQL |

## Dimension: Code Architecture

**Score:** 89% — Grade **B**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| ARCH-01 | Declared architectural pattern | high | PASS | FSD + layered DAL explicitly documented per layer |
| ARCH-02 | Module boundaries respected | high | WARN | 3 files bypass service layer importing directly from @/data-access-layer/repository (steam-import, journal, app/journal page) |
| ARCH-03 | Single Responsibility | medium | PASS | All 14 feature modules focused with descriptive names |
| ARCH-04 | Separation of concerns | high | PASS | Clear separation across sampled files; UI contains no data access logic |
| ARCH-05 | Consistent naming | medium | PASS | Consistent kebab-case (TS) and snake_case (Python) |
| ARCH-06 | Reasonable file sizes | medium | PASS | 1.2% of source files exceed 500 lines; none exceed 2000 |

## Dimension: Documentation Quality

**Score:** 75% — Grade **B**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| DOC-01 | Root README useful | critical | PASS | Setup instructions present (pnpm install, pnpm dev) |
| DOC-02 | Service-level READMEs | high | WARN | 3/4 service dirs have READMEs; scripts/ missing |
| DOC-03 | API documentation | high | SKIP | Small internal API with co-located client |
| DOC-04 | No stale documentation | medium | WARN | Dead link: savepoint-app/README.md line 492 references ./documentation/ which doesn't exist |

## Dimension: AI Development Tooling

**Score:** 48% — Grade **D**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| AI-01 | CLAUDE.md ecosystem context | critical | FAIL | No root CLAUDE.md exists; no file provides project purpose, cross-service relationships, or top-level commands |
| AI-02 | Custom slash commands | medium | PASS | 9 AWOS commands in .claude/commands/awos/ |
| AI-03 | Skills configured | low | PASS | 3 skills: frontend-design, react-best-practices, react-feature-sliced-design |
| AI-04 | MCP servers configured | low | PASS | awos-recruitment in .mcp.json; Playwright plugin enabled |
| AI-05 | Hooks configured | low | PASS | PreToolUse hook for sensitive file blocking |
| AI-06 | CLAUDE.md quality | high | WARN | Directory tree listings and code templates in some files; import rules duplicated across DAL files |
| AI-07 | Agent can run and observe app | critical | WARN | Playwright plugin enabled; no dev server instructions in any CLAUDE.md; Lambda workers lack local invoke tooling |

## Dimension: Security Guardrails

**Score:** 69% — Grade **C**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| SEC-01 | .env files gitignored | critical | WARN | .env patterns in .gitignore; savepoint-app/.env.test committed with localhost test credentials |
| SEC-02 | AI agent hooks restrict sensitive files | critical | PASS | PreToolUse hooks block .env, *.pem, *.key, credentials*, secrets* via check-sensitive-files.sh |
| SEC-03 | .env.example exists | high | PASS | Templates at root and both service dirs with placeholders |
| SEC-04 | No secrets in committed files | critical | WARN | Only test fixtures found (TestPassword123!, postgres:postgres) — no real secrets |
| SEC-05 | Sensitive files in .gitignore | high | WARN | Missing *.p12, *.pfx, credentials*, secrets* patterns from .gitignore |

## Dimension: Software Best Practices

**Score:** 100% — Grade **A**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| SBP-01 | Linting configured | high | PASS | ESLint + Ruff with CI enforcement |
| SBP-02 | Formatting automated | medium | PASS | Prettier + lint-staged + Ruff; CI-enforced format checks |
| SBP-03 | Type safety enforced | high | PASS | strict: true in both TypeScript and mypy |
| SBP-04 | Test infrastructure | critical | PASS | 98+ test files across Vitest, Playwright, pytest |
| SBP-05 | CI/CD pipeline | high | PASS | 4 GitHub Actions workflows covering lint, test, deploy |
| SBP-06 | Error handling consistent | high | PASS | Result pattern throughout; global error handlers; structured logging |
| SBP-07 | Dependencies managed | medium | PASS | Lock files for all 3 ecosystems; Dependabot configured weekly |

## Dimension: Spec-Driven Development

**Score:** 82% — Grade **B**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| SDD-01 | AWOS installed | critical | PASS | 9 commands, 9 wrappers, context dirs present |
| SDD-02 | Product context complete | high | PASS | product-definition, roadmap, architecture all substantive |
| SDD-03 | Architecture reflects reality | high | PASS | Core stack confirmed; no major drift |
| SDD-04 | Features via specs | critical | WARN | 3/6 features (50%) have spec correlation; auth migration, images, username-validation lack specs |
| SDD-05 | Spec directories complete | high | WARN | 3/4 specs have full triad; 005-library-status-redesign missing tasks.md |
| SDD-06 | No stale specs | medium | PASS | All specs show progress; no stale or abandoned |
| SDD-07 | Agent assignments | medium | PASS | 91% of sub-tasks annotated with domain-appropriate agents |

## Dimension: End-to-End Delivery

**Score:** 50% — Grade **D**

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| E2E-01 | Cross-layer feature branches | high | FAIL | 2/13 feature commits (~15%) touch 2+ service dirs; development concentrated in savepoint-app |
| E2E-02 | No layer-split branching | medium | PASS | No -backend/-frontend branch pairs found |
| E2E-03 | Spec-to-delivery traceability | high | WARN | Tasks.md items track implementation but commits don't reference spec paths; one-directional only |
| E2E-04 | No orphaned artifacts | medium | PASS | All layers connected via SQS, shared DB, and deploy pipeline |
| E2E-05 | Shared ownership enablers | medium | WARN | docker-compose and deploy.yml exist; no root task runner, pnpm-workspace excludes lambdas-py/infra, PR checks only validate Next.js |

## Top Recommendations

| # | Priority | Effort | Dimension | Recommendation |
|---|----------|--------|-----------|----------------|
| 1 | P0 | Low | AI Development Tooling | Create root CLAUDE.md with project purpose, cross-service architecture overview, and key commands |
| 2 | P1 | Low | AI Development Tooling | Add dev server run instructions (pnpm dev, required env vars, DB setup) to CLAUDE.md ecosystem |
| 3 | P1 | Low | Spec-Driven Development | Create specs for new features before implementation; target 70%+ spec-to-branch ratio |
| 4 | P1 | Low | Spec-Driven Development | Generate tasks.md for spec 005-library-status-redesign |
| 5 | P1 | Low | End-to-End Delivery | Include lambdas-py and infra changes in feature branches when features span layers |
| 6 | P2 | Low | Code Architecture | Fix repository bypass: route 3 files through service layer instead of importing directly from repository |
| 7 | P2 | Low | AI Development Tooling | Remove directory tree listings and code templates from CLAUDE.md files |
| 8 | P2 | Low | Security Guardrails | Add *.p12, *.pfx, credentials*, secrets* patterns to .gitignore |
| 9 | P2 | Low | Documentation Quality | Fix dead link to ./documentation/ in savepoint-app/README.md; add README to scripts/ |
| 10 | P2 | Medium | End-to-End Delivery | Add root Makefile/Taskfile with cross-layer commands; extend PR checks to lambdas-py |
