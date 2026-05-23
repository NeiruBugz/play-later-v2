# Code Audit Report

**Date:** 2026-05-23
**Scope:** all dimensions
**Overall Score:** 94% — Grade **A** (93.6% precise)
**Previous Audit:** 2026-05-18 — 90% Grade B

## Summary

| #   | Dimension                | Score | Grade | Delta | Critical | High | Medium | Low |
| --- | ------------------------ | ----- | ----- | ----- | -------- | ---- | ------ | --- |
| 1   | Project Topology         | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 2   | Code Architecture        | 100%  | A     | +11   | 0        | 0    | 0      | 0   |
| 3   | Documentation Quality    | 83%   | B     | -3    | 0        | 0    | 1      | 0   |
| 4   | AI Development Tooling    | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 5   | Prompt & Agent Integrity | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 6   | Quality Assurance        | 81%   | B     | -4    | 0        | 1    | 0      | 1   |
| 7   | Security Guardrails      | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 8   | Software Best Practices  | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 9   | Spec-Driven Development   | 100%  | A     | +7    | 0        | 0    | 0      | 0   |
| 10  | Supply Chain Security    | 72%   | C     | 0     | 1        | 1    | 1      | 0   |
| 11  | End-to-End Delivery      | 93%   | A     | +29   | 0        | 0    | 1      | 0   |

> Counts are FAIL+WARN combined per severity. Seven dimensions are perfect 100/A. The headline story is the **completion of the spec-021 TanStack migration**: `savepoint-app/` (the old Next.js app) is fully removed, which lifted End-to-End Delivery from 64%→93% (the side-by-side single-layer-branch problem is gone) and Code Architecture 89%→100% (the DAL→features reverse-imports disappeared with the old app). The one remaining hard blocker is `supply-chain-security` (a `nitro` beta published 1 day ago sits inside the 7-day quarantine window). The migration also left two stale-doc artifacts behind.

## Dimension: Project Topology

**Score:** 100% — Grade **A**

| #   | Check                              | Severity | Status | Evidence                                                                                          |
| --- | ---------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------- |
| 1   | Repository structure type          | medium   | PASS   | Monorepo: 2 build roots — pnpm workspace `savepoint-tanstack` + Terraform `infra`.                |
| 2   | Application layer inventory        | medium   | PASS   | Full-stack TanStack Start v1 app + Prisma 7 ORM + Terraform IaC. `savepoint-app/` removed.        |
| 3   | Database and storage detection     | medium   | PASS   | PostgreSQL 16 (Prisma, 50 migrations, :6432); AWS S3/LocalStack object storage.                   |
| 4   | Infrastructure layer detection     | medium   | PASS   | Terraform (Cognito + S3, dev/prod); Docker Compose; Vercel; GitHub Actions.                       |
| 5   | Language inventory                 | medium   | PASS   | TS dominant (740 .ts + 411 .tsx); 14 HCL; 29 .jsx are spec mockups (non-source).                  |
| 6   | Inter-layer communication patterns | medium   | PASS   | `createServerFn` RPC (52 files), better-auth, IGDB/Steam HTTP, AWS SDK. No OpenAPI/gRPC/GraphQL.  |

## Dimension: Code Architecture

**Score:** 100% — Grade **A** (+11)

| #   | Check                                       | Severity | Status | Evidence                                                                                            |
| --- | ------------------------------------------- | -------- | ------ | --------------------------------------------------------------------------------------------------- |
| 1   | Declared/recognizable architectural pattern | high     | PASS   | FSD declared in `savepoint-tanstack/CLAUDE.md` with full layer map; structure matches exactly.      |
| 2   | Module boundaries respected                 | high     | PASS   | `eslint-plugin-boundaries` enforces it; 0 boundary errors; 0 upward imports; regression guard exists.|
| 3   | SRP — modules well-scoped                   | medium   | PASS   | 6 focused top-level dirs, 29 single-intent feature slices, zero god modules.                        |
| 4   | Separation of concerns across layers        | high     | PASS   | 0 UI files touch Prisma; data access isolated to `*.server.ts` queries + `createServerFn`.          |
| 5   | Consistent file/dir naming                  | medium   | PASS   | 0 of 734 basenames uppercase (all kebab-case); tests colocated.                                     |
| 6   | Reasonable file sizes                       | medium   | PASS   | Only 2/735 files (0.27%) exceed 500 LOC, both tests; largest non-test 414 LOC.                      |

## Dimension: Documentation Quality

**Score:** 83% — Grade **B** (-3)

| #   | Check                            | Severity | Status | Evidence                                                                                                  |
| --- | -------------------------------- | -------- | ------ | --------------------------------------------------------------------------------------------------------- |
| 1   | Root README exists and is useful | critical | PASS   | Accurate, followable; matches `package.json` scripts; reflects post-migration reality.                    |
| 2   | Service-level READMEs exist      | high     | PASS   | Both `savepoint-tanstack/` and `infra/` have READMEs with build/run instructions.                         |
| 3   | API documentation                | medium   | SKIP   | Small closed internal API (52 co-located `createServerFn` RPC files, no public/OpenAPI surface).          |
| 4   | No stale documentation           | medium   | FAIL   | `savepoint-tanstack/README.md` still frames app as side-by-side rewrite of removed `../savepoint-app/`, gives wrong prisma command, tells contributors to migrate in deleted dir. Plus `infra/` docs cite wrong module path. |

## Dimension: AI Development Tooling

**Score:** 100% — Grade **A**

| #   | Check                                   | Severity | Status | Evidence                                                                                          |
| --- | --------------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------- |
| 1   | CLAUDE.md ecosystem provides AI context | critical | PASS   | 6 CLAUDE.md + CONTEXT.md + FOOT-GUNS.md + 10 `.claude/rules/tanstack/*.md`; full coverage.         |
| 2   | Custom slash commands exist             | medium   | PASS   | 10 commands under `.claude/commands/awos/`.                                                        |
| 3   | Skills are configured                   | low      | PASS   | 5 skills with valid frontmatter.                                                                  |
| 4   | MCP servers configured                  | low      | PASS   | `.mcp.json` with 3 servers (awos-recruitment, terraform, aws-knowledge).                          |
| 5   | Hooks are configured                    | low      | PASS   | PreToolUse + PostToolUse hooks in `.claude/settings.json`.                                         |
| 6   | CLAUDE.md files meaningful/structured   | high     | PASS   | All under 200-line guideline (max 182); prescriptive content, not directory dumps.                |
| 7   | Agent can run and observe the app       | critical | PASS   | Web UI via playwright plugin, API via curl, IaC via terraform-mcp + `terraform plan`.             |

## Dimension: Prompt & Agent Integrity

**Score:** 100% — Grade **A**

| #   | Check                                        | Severity | Status | Evidence                                                                                  |
| --- | -------------------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------- |
| 1   | No invisible/hidden Unicode in prompt files  | critical | PASS   | Byte-scan of 67 prompt files — no zero-width/directional/tag chars.                       |
| 2   | No prompt injection patterns                 | critical | PASS   | All `.env` mentions are defensive config guidance; no offensive patterns.                 |
| 3   | Hook scripts no suspicious commands          | critical | PASS   | Two hooks — sensitive-file blocker + prettier/eslint formatter. No exfil/obfuscation.     |
| 4   | MCP configs point to trusted endpoints       | critical | PASS   | All 3 servers https/official images on trusted endpoints; no creds/bare IPs.              |
| 5   | Agent/config files have git provenance       | high     | PASS   | All critical configs tracked; `settings.local.json` correctly gitignored.                 |
| 6   | Skill/command files no security-bypass       | critical | PASS   | No bypass instructions; no `$ARGUMENTS`/`bash -c`/`eval` injection sinks.                  |

## Dimension: Quality Assurance

**Score:** 81% — Grade **B** (-4)

| #   | Check                          | Severity | Status | Evidence                                                                                            |
| --- | ------------------------------ | -------- | ------ | --------------------------------------------------------------------------------------------------- |
| 1   | Test infra w/ adequate coverage| critical | PASS   | 184 test files; v8 coverage gate (stmts 85/branches 86/lines 83/fns 79) enforced in CI.             |
| 2   | Unit tier present              | high     | PASS   | 136 unit/component tests (jsdom + mocked Prisma).                                                    |
| 3   | Integration tier present       | high     | PASS   | 48 integration tests against real PostgreSQL on :6432, sequential.                                  |
| 4   | E2E tier present               | high     | FAIL   | No Playwright/Cypress config, deps, or `e2e/` dirs. Only material testing gap.                       |
| 5   | Pyramid shape — no inversion   | medium   | PASS   | unit (136) ≥ integration (48) ≥ e2e (0). Healthy.                                                    |
| 6   | Coverage reporting configured  | low      | PASS   | v8 provider with real thresholds, gated in CI.                                                       |
| 7   | Test data management           | low      | WARN   | No factory lib (`@faker-js/faker`/`fishery`) or `prisma/seed.*`; integration data built inline.     |
| 8   | Test isolation — mocking       | medium   | PASS   | `vi.mock` in 81 of 136 unit files. (Note: MSW is NOT present, contrary to earlier assumption.)      |
| 9   | Contract testing               | high     | SKIP   | Single-service repo, no inter-service communication.                                                |
| 10  | ML model iteration testing     | high     | SKIP   | No ML layer.                                                                                         |

## Dimension: Security Guardrails

**Score:** 100% — Grade **A**

| #   | Check                                | Severity | Status | Evidence                                                                                           |
| --- | ------------------------------------ | -------- | ------ | -------------------------------------------------------------------------------------------------- |
| 1   | .env files are gitignored            | critical | PASS   | `.env` + variants ignored at root & service level; `git ls-files` shows only `.env.example` files. |
| 2   | AI agent hooks restrict sensitive    | critical | PASS   | PreToolUse hook blocks `.env`/`*.pem`/`*.key`/`credentials*`/`secrets*` — verified live.           |
| 3   | .env.example/template exists         | high     | PASS   | Placeholder templates at root and `savepoint-tanstack/`.                                            |
| 4   | No secrets in committed files        | critical | PASS   | Only `AKIA…` hit is the AWS doc example string; rest are types/placeholders.                        |
| 5   | Sensitive files in .gitignore        | high     | PASS   | Covers env, Terraform state/tfvars/plan, AWS creds, OS junk.                                        |

## Dimension: Software Best Practices

**Score:** 100% — Grade **A**

| #   | Check                            | Severity | Status | Evidence                                                                                           |
| --- | -------------------------------- | -------- | ------ | -------------------------------------------------------------------------------------------------- |
| 1   | Linting configured and enforced  | high     | PASS   | Flat ESLint config + typescript-eslint + react-hooks + FSD boundaries; `--max-warnings 0` in CI.   |
| 2   | Formatting automated             | medium   | PASS   | Prettier config + ignore + `format`/`format:check` scripts + CI gate.                              |
| 3   | Type safety enforced             | high     | PASS   | `strict:true` + extra strict flags; zero `any` in non-test source.                                 |
| 5   | CI/CD pipeline exists            | high     | PASS   | `pr-checks-tanstack.yml`: typecheck, lint, format, build, coverage gate, audit, migration check.   |
| 6   | Error handling consistent        | high     | PASS   | 54 catch blocks; sampled all log via pino + rethrow typed `AppError`; global ErrorBoundary.        |
| 7   | Dependencies managed             | medium   | PASS   | `pnpm-lock.yaml` + Dependabot (npm/terraform/actions) + 7-day freshness gate.                       |

## Dimension: Spec-Driven Development

**Score:** 100% — Grade **A** (+7)

| #   | Check                                   | Severity | Status | Evidence                                                                                            |
| --- | --------------------------------------- | -------- | ------ | --------------------------------------------------------------------------------------------------- |
| 1   | AWOS installed and set up               | critical | PASS   | 9 commands, 10 wrappers, scripts + 6 templates, populated `context/product/` + 19 specs.            |
| 2   | Product context documents complete      | high     | PASS   | product-definition (100 ln), roadmap (141 ln, 5 phases), architecture (256 ln).                     |
| 3   | Architecture doc reflects reality       | high     | PASS   | architecture.md refreshed to v3.0 on 2026-05-23; no phantom Next.js drift; all major tech confirmed.|
| 4   | Features implemented through specs       | critical | PASS   | 19 spec dirs; ~75% of recent feat commits reference a spec/slice/PR.                                 |
| 5   | Spec dirs structurally complete         | high     | PASS   | 18/20 dirs complete (90%); `019-ui-hardening` partial (no tasks.md).                                |
| 6   | No stale or abandoned specs             | medium   | PASS   | Zero stale; non-Draft specs all Completed; only Draft (016) genuinely mid-progress (39/79).         |
| 7   | Tasks have meaningful agent assignments | medium   | PASS   | All tasks.md agent-annotated; verification routes to testing/code-reviewer agents.                  |

## Dimension: Supply Chain Security

**Score:** 72% — Grade **C** (0)

| #   | Check                                | Severity | Status | Evidence                                                                                            |
| --- | ------------------------------------ | -------- | ------ | --------------------------------------------------------------------------------------------------- |
| 1   | Lockfiles committed to git           | critical | PASS   | `pnpm-lock.yaml` present and tracked.                                                                |
| 2   | Lockfiles contain integrity hashes   | high     | PASS   | All sampled registry entries carry `integrity:` hashes.                                             |
| 3   | No permissive version ranges         | high     | WARN   | All 75 app deps exact-pinned; residual carets on root `@commitlint/config-conventional` + 3 overrides.|
| 4   | 7-day quarantine                     | critical | FAIL   | `nitro@3.0.260522-beta` published 2026-05-22 (1 day ago), inside window, NOT allowlisted. TanStack/react-router deps now properly allowlisted as CVE remediations. |
| 5   | Dependency review enforces approval  | high     | PASS   | Dependabot configured (no automerge); freshness gate runs on PRs.                                   |
| 6   | Vulnerability scanning in CI         | critical | PASS   | Blocking `pnpm audit --prod --audit-level=high` on PRs (was prior FAIL — now fixed).                |
| 7   | Dependency overrides reviewed         | high     | PASS   | Overrides pin specific versions; documented in `DEPENDENCY_DECISIONS.md`.                            |
| 8   | Dependency count / attack surface    | medium   | FAIL   | 1110 resolved tarballs exceeds the >1000 flag; direct-to-total ratio (~14.6:1) is healthy.          |

## Dimension: End-to-End Delivery

**Score:** 93% — Grade **A** (+29)

| #   | Check                          | Severity | Status | Evidence                                                                                            |
| --- | ------------------------------ | -------- | ------ | --------------------------------------------------------------------------------------------------- |
| 1   | Cross-layer feature branches   | high     | PASS   | 6 sampled feat commits all span `routes/`+`features/`+`entities/`(+`widgets/`) within the full-stack app. |
| 2   | No layer-split branching       | medium   | PASS   | No `*-backend`/`*-frontend`/`*-api`/`*-ui` paired branches.                                          |
| 3   | Spec-to-delivery traceability  | high     | PASS   | Bidirectional: spec dirs map to named branches; 61/99 feat commits reference specs; spec-021 tasks.md has 247 checked items matching commits. |
| 4   | No orphaned artifacts          | medium   | WARN   | 0/42 `createServerFn` endpoints orphaned; all 15 Prisma models connected. One documented-legacy orphan: `Review` model (annotated pending Phase 2B). |
| 5   | Shared ownership enablers      | medium   | PASS   | Root `pnpm-workspace.yaml`, root `docker-compose.yml` (full stack), shared CI.                      |

## Top Recommendations

| #   | Priority | Effort | Dimension              | Recommendation                                                                                              |
| --- | -------- | ------ | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | P0       | Low    | Supply Chain Security  | Repin `nitro` to a version published >7 days ago, OR add it to `package-freshness-allowlist.json` with a documented risk review. Clears the critical SCS-04 FAIL and raises the dimension to ~89% (B). |
| 2   | P1       | Medium | Quality Assurance      | Add an E2E test tier (Playwright) covering 2-3 critical user flows (Steam import, library add/status, auth). Closes the only testing-pyramid gap. |
| 3   | P2       | Low    | Documentation          | Rewrite `savepoint-tanstack/README.md` for post-cutover reality — drop all `../savepoint-app/` references, fix the wrong `prisma migrate` command, state migrations are owned here. |
| 4   | P2       | Low    | Documentation          | Fix `infra/CLAUDE.md` + `infra/README.md` module path: `infra/modules/cognito` → `infra/envs/modules/cognito`. |
| 5   | P2       | Low    | AI Dev Tooling / Hooks | Repoint `.claude/hooks/format-and-lint.sh` from the removed `savepoint-app/` to `savepoint-tanstack/` — the format-on-save hook is currently a dead no-op. |
| 6   | P2       | Low    | Supply Chain Security  | Pin remaining caret deps to exact versions (`@commitlint/config-conventional`, `valibot`/`glob`/`js-yaml` overrides) per the project's exact-pinning preference. Resolves SCS-03 WARN. |
| 7   | P2       | Medium | Supply Chain Security  | Review the 1110-package transitive tree (SCS-08) for prunable dev dependencies, or document acceptance given the full TanStack + React 19 + AWS SDK + Prisma stack. |
| 8   | P2       | Low    | Quality Assurance      | Introduce a fixture/factory layer (`fishery` or `@faker-js/faker`) or a `prisma/seed.*` for integration test data instead of inline `create` calls. Resolves QA-07 WARN. |
| 9   | P2       | Low    | Supply Chain Security  | Refresh `DEPENDENCY_DECISIONS.md` to match current pinned versions (`hono`, `fast-xml-parser` drifted in the safe direction). |
| 10  | P2       | Low    | End-to-End Delivery    | Confirm intent of the legacy `Review` Prisma model (documented orphan pending Phase 2B) — track or remove. No action required now. |

Sort: P0 first, then P1, then P2 by effort. Limited to the top 10 most impactful.
