# Code Audit Report

**Date:** 2026-04-28
**Scope:** all dimensions
**Overall Score:** 93% — Grade **A**
**Previous Audit:** 2026-04-01 — 91% Grade A

## Summary

| #   | Dimension                | Score | Grade | Delta | Critical | High | Medium | Low |
| --- | ------------------------ | ----- | ----- | ----- | -------- | ---- | ------ | --- |
| 1   | Project Topology         | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 2   | Code Architecture        | 88%   | B     | -12   | 0        | 1    | 0      | 0   |
| 3   | Documentation Quality    | 75%   | B     | -17   | 0        | 1    | 1      | 0   |
| 4   | AI Development Tooling   | 100%  | A     | +14   | 0        | 0    | 0      | 0   |
| 5   | Quality Assurance        | 85%   | B     | new   | 1        | 0    | 0      | 1   |
| 6   | Security Guardrails      | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 7   | Software Best Practices  | 95%   | A     | -5    | 0        | 0    | 1      | 0   |
| 8   | Spec-Driven Development  | 96%   | A     | +14   | 0        | 0    | 1      | 0   |
| 9   | End-to-End Delivery      | 100%  | A     | +36   | 0        | 0    | 0      | 0   |

## Dimension: Project Topology

**Score:** 100% — Grade **A**

| #       | Check                              | Severity | Status | Evidence                                                                                  |
| ------- | ---------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------- |
| TOPO-01 | Repository structure type          | medium   | PASS   | Monorepo: pnpm workspace (`savepoint-app/`) + Terraform layer (`infra/`); lambdas-py retired (1b03733) |
| TOPO-02 | Application layer inventory        | medium   | PASS   | (1) Next.js 15 web-app at `savepoint-app/`; (2) Terraform IaC at `infra/`                 |
| TOPO-03 | Database and storage detection     | medium   | PASS   | PostgreSQL 16 (Prisma); Postgres :6432, pgAdmin :5050, LocalStack :4568; AWS S3 module    |
| TOPO-04 | Infrastructure layer detection     | medium   | PASS   | Terraform >=1.5, AWS ~>5.0; modules `cognito`, `s3`; Docker Compose; 4 GH Actions workflows |
| TOPO-05 | Language inventory                 | medium   | PASS   | TS: 693 .ts + 438 .tsx = 1131; JSX: 29; HCL: 14                                           |
| TOPO-06 | Inter-layer communication patterns | medium   | PASS   | Next.js REST routes + `next-safe-action`; external IGDB/Steam/Cognito/S3                  |

## Dimension: Code Architecture

**Score:** 88% — Grade **B**

| #       | Check                                          | Severity | Status | Evidence                                                                                          |
| ------- | ---------------------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------- |
| ARCH-01 | Declared or recognizable architectural pattern | high     | PASS   | FSD declared in `features/CLAUDE.md`; on-disk `app/`, `widgets/`, `features/`, `shared/` + DAL    |
| ARCH-02 | Module boundaries are respected                | high     | WARN   | 7 DAL→features imports (2 runtime — `validateUsername` in profile-service, `SearchGamesSchema` in igdb-handler — and 5 type-only) violate declared one-way direction |
| ARCH-03 | Single Responsibility Principle in modules     | medium   | PASS   | Domain-named modules; no `helpers/`/`misc/`/`common/`; largest cluster `features/library/ui` 29 files |
| ARCH-04 | Separation of concerns across layers           | high     | PASS   | DAL handler→service→repository→domain split honored; features split UI/server-actions/use-cases  |
| ARCH-05 | Consistent file and directory naming           | medium   | PASS   | kebab-case throughout; tests colocated; canonical Terraform filenames                             |
| ARCH-06 | Reasonable file sizes                          | medium   | PASS   | 4/620 source files >500 lines (0.65%); none >1000                                                 |

## Dimension: Documentation Quality

**Score:** 75% — Grade **B**

| #      | Check                            | Severity | Status | Evidence                                                                                          |
| ------ | -------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------- |
| DOC-01 | Root README exists and is useful | critical | PASS   | Project overview, quickstart, AWOS workflow; new-dev-followable                                   |
| DOC-02 | Service-level READMEs exist      | high     | WARN   | Missing in `app/api/`, `prisma/`, `infra/modules/`, `infra/envs/`                                 |
| DOC-03 | API documentation                | high     | SKIP   | Internal closed API + co-located client; no public consumers                                      |
| DOC-04 | No stale documentation           | medium   | WARN   | `README.md:10` claims RDS/ECS; `CLAUDE.md:8` claims ECR/SQS/Secrets Manager — none exist post-1b03733 |

## Dimension: AI Development Tooling

**Score:** 100% — Grade **A**

| #     | Check                                              | Severity | Status | Evidence                                                                                |
| ----- | -------------------------------------------------- | -------- | ------ | --------------------------------------------------------------------------------------- |
| AI-01 | CLAUDE.md ecosystem provides adequate AI context   | critical | PASS   | 26 CLAUDE.md files; root + layer-level + per-feature/widget; all essentials covered     |
| AI-02 | Custom slash commands exist                        | medium   | PASS   | 10 commands under `.claude/commands/awos/`                                              |
| AI-03 | Skills are configured                              | low      | PASS   | 5 skills (frontend-design, grill-me, react-best-practices, react-fsd, terraform)        |
| AI-04 | MCP servers configured                             | low      | PASS   | `.mcp.json` defines 3 (awos-recruitment, terraform-mcp, aws-knowledge-mcp)              |
| AI-05 | Hooks are configured                               | low      | PASS   | PreToolUse (sensitive file guard) + PostToolUse (auto format+lint)                      |
| AI-06 | CLAUDE.md files are meaningful and well-structured | high     | PASS   | All 26 files <200 lines (max 188); concrete, non-obvious; no tree dumps                 |
| AI-07 | Agent can run and observe the application          | critical | PASS   | Playwright plugin enabled for Web UI; Bash/curl for API; `terraform plan` for IaC       |

## Dimension: Quality Assurance

**Score:** 85% — Grade **B**

| #      | Check                                  | Severity | Status | Evidence                                                                              |
| ------ | -------------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------- |
| QA-01  | Test infrastructure with adequate coverage | critical | WARN   | 152 test files vs 619 source modules — file-linkage ratio ~25%                       |
| QA-02  | Unit tier present                      | high     | PASS   | 35 `*.unit.test.ts` files; dedicated utilities + backend Vitest projects             |
| QA-03  | Integration tier present               | high     | PASS   | 27 `*.integration.test.ts`; integration project with `pool: forks`                    |
| QA-04  | E2E tier present                       | high     | PASS   | Playwright + 10 `.spec.ts` in `savepoint-app/e2e/`                                   |
| QA-05  | Pyramid shape — no inversion           | medium   | PASS   | unit/component/backend ~150 >> integration 27 >> e2e 10                               |
| QA-06  | Coverage reporting configured          | low      | WARN   | `vitest.coverage.config.ts` configured but no `thresholds` block                      |
| QA-07  | Test data management                   | low      | PASS   | `test/fixtures/`, `test/setup/db-factories/`, `@faker-js/faker`                       |
| QA-08  | Test isolation — mocking infrastructure | medium   | PASS   | `vi.mock` in 94 files; MSW 2.13; aws-sdk-client-mock 4.1                             |
| QA-09  | Contract testing                       | high     | SKIP   | Single web app + IaC; no inter-service contracts                                      |
| QA-10  | ML model iteration testing             | high     | SKIP   | No ML frameworks                                                                      |

## Dimension: Security Guardrails

**Score:** 100% — Grade **A**

| #      | Check                                          | Severity | Status | Evidence                                                                       |
| ------ | ---------------------------------------------- | -------- | ------ | ------------------------------------------------------------------------------ |
| SEC-01 | `.env` files are gitignored                    | critical | PASS   | `.gitignore:41-51`; only `*.env.example` and placeholder `.env.test` tracked  |
| SEC-02 | AI agent hooks restrict access to sensitive files | critical | PASS   | PreToolUse hook blocks Read/Edit/Write/Glob/Grep/Bash on env/keys/secrets    |
| SEC-03 | `.env.example` or template exists              | high     | PASS   | Root + `savepoint-app/` + Terraform `dev`/`prod` tfvars.example, all placeholders |
| SEC-04 | No secrets in committed files                  | critical | PASS   | rg for AKIA/PRIVATE KEY/credential-like patterns: no real secrets found       |
| SEC-05 | Sensitive files in `.gitignore` coverage       | high     | PASS   | Stack-relevant: keys, certs, tfstate, tfvars, build artifacts, IDE dirs        |

## Dimension: Software Best Practices

**Score:** 95% — Grade **A**

| #      | Check                              | Severity | Status | Evidence                                                                                   |
| ------ | ---------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------------ |
| SBP-01 | Linting configured and enforced    | high     | PASS   | ESLint flat config; `--max-warnings 0`; `eslint-plugin-boundaries` enforces DAL layering   |
| SBP-02 | Formatting automated               | medium   | WARN   | Prettier + lint-staged installed but no `.husky/`; pre-commit relies on CI                 |
| SBP-03 | Type safety enforced               | high     | PASS   | `strict: true`, `strictNullChecks`; zero `@ts-ignore`; only 2 incidental `any` in e2e      |
| SBP-05 | CI/CD pipeline exists              | high     | PASS   | 4 workflows: pr-checks, deploy, e2e, integration                                            |
| SBP-06 | Error handling consistent          | high     | PASS   | All sampled catch blocks delegate to `handleServiceError`; structured Pino logs            |
| SBP-07 | Dependencies managed               | medium   | PASS   | `pnpm-lock.yaml`; Dependabot weekly (npm + terraform); pinned exact versions               |

## Dimension: Spec-Driven Development

**Score:** 96% — Grade **A**

| #      | Check                                       | Severity | Status | Evidence                                                                                 |
| ------ | ------------------------------------------- | -------- | ------ | ---------------------------------------------------------------------------------------- |
| SDD-01 | AWOS is installed and set up                | critical | PASS   | 11 `.awos/commands/` + 11 wrappers; `context/product/` + `context/spec/` present         |
| SDD-02 | Product context documents are complete      | high     | PASS   | product-definition (100L), roadmap (141L), architecture (795L)                           |
| SDD-03 | Architecture document reflects codebase reality | high | PASS   | Stack declarations confirmed in package.json + topology; lambdas-py removal reflected     |
| SDD-04 | Features are implemented through specs      | critical | PASS   | 15 numbered specs (002–016); 6 of 8 recent feat branches touched specs (~75%)            |
| SDD-05 | Spec directories are structurally complete  | high     | PASS   | 15 of 16 (94%) have full triad; `jewel-theme/` skeleton predates AWOS                    |
| SDD-06 | No stale or abandoned specs                 | medium   | WARN   | `005-library-status-redesign/functional-spec.md` missing `Status:` line despite shipped  |
| SDD-07 | Tasks have meaningful agent assignments     | medium   | PASS   | All 15 tasks.md annotated; specialist agents dominate; general-purpose on glue/verify    |

## Dimension: End-to-End Delivery

**Score:** 100% — Grade **A**

| #      | Check                              | Severity | Status | Evidence                                                                                |
| ------ | ---------------------------------- | -------- | ------ | --------------------------------------------------------------------------------------- |
| E2E-01 | Cross-layer feature branches       | high     | PASS   | 6 of 8 recent feat branches cross ≥2 top-level dirs (75%, threshold ≥50%)                |
| E2E-02 | No layer-split branching pattern   | medium   | PASS   | No `*-backend`/`*-frontend`/`*-api`/`*-ui` paired branches                               |
| E2E-03 | Spec-to-delivery traceability      | high     | PASS   | Bidirectional — commits cite spec numbers; specs have ticked tasks.md                    |
| E2E-04 | No orphaned artifacts              | medium   | PASS   | API↔UI↔DB end-to-end connected; no defined-but-unreferenced surfaces                     |
| E2E-05 | Shared ownership enablers          | medium   | PASS   | Root `Makefile`, `docker-compose.yml`, workspace `package.json`, 4 unified GH workflows  |

## Top Recommendations

| #   | Priority | Effort | Dimension                | Recommendation                                                                                              |
| --- | -------- | ------ | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| 1   | P1       | Low    | Documentation Quality    | Update `README.md:10` and `CLAUDE.md:8` to remove retired RDS/ECS/ECR/SQS/Secrets Manager references        |
| 2   | P1       | Medium | Quality Assurance        | Improve test linkage ratio (~25%) — co-locate `*.test.ts` with under-tested DAL services and feature use-cases |
| 3   | P1       | Medium | Documentation Quality    | Add READMEs (or pointer CLAUDE.md) in `app/api/`, `prisma/`, `infra/modules/`, `infra/envs/`                |
| 4   | P2       | Low    | Quality Assurance        | Add `coverage.thresholds` block in `vitest.coverage.config.ts` to gate CI on coverage regressions           |
| 5   | P2       | Low    | Spec-Driven Development  | Add `**Status:** Completed` line to `context/spec/005-library-status-redesign/functional-spec.md`           |
| 6   | P2       | Low    | Software Best Practices  | Wire `.husky/pre-commit` to invoke `lint-staged` so formatting/lint enforce locally, not only in CI         |
| 7   | P2       | Medium | Code Architecture        | Lift `validateUsername` + shared schemas/types from `features/*` into `shared/` or `data-access-layer/domain/` to remove the 7 DAL→features import leaks |
