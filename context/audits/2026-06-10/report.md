# Code Audit Report

**Date:** 2026-06-10
**Scope:** all dimensions
**Overall Score:** 96% — Grade **A** (95.9% precise)
**Previous Audit:** 2026-05-23 — 94% Grade A

## Summary

| #   | Dimension                | Score | Grade | Delta | Critical | High | Medium | Low |
| --- | ------------------------ | ----- | ----- | ----- | -------- | ---- | ------ | --- |
| 1   | Project Topology         | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 2   | Code Architecture        | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 3   | Documentation Quality    | 100%  | A     | +17   | 0        | 0    | 0      | 0   |
| 4   | AI Development Tooling    | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 5   | Prompt & Agent Integrity | 91%   | A     | -9    | 1        | 0    | 0      | 0   |
| 6   | Quality Assurance        | 83%   | B     | +2    | 0        | 1    | 0      | 0   |
| 7   | Security Guardrails      | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 8   | Software Best Practices  | 100%  | A     | 0     | 0        | 0    | 0      | 0   |
| 9   | Spec-Driven Development   | 93%   | A     | -7    | 0        | 1    | 0      | 0   |
| 10  | Supply Chain Security    | 94%   | A     | +22   | 0        | 1    | 0      | 0   |
| 11  | End-to-End Delivery      | 92%   | A     | -1    | 0        | 0    | 1      | 0   |

> Counts are FAIL+WARN combined per severity. **Eight dimensions are perfect 100/A**; the overall climbs to 96% (best on record), up from 94%. The headline story is **Supply Chain Security recovering +22 to 94% A** — the prior critical quarantine FAIL (`nitro@3.0.260522-beta`, 1 day old at last audit) has aged 19 days past the 7-day window, and 40 sampled direct versions all clear the cutoff. **Documentation hit a clean 100%** (+17) after the post-migration stale-doc artifacts were resolved. Two small regressions are both *additions*, not decay: Prompt Integrity (−9) reflects a newly-added remote-fetch MCP server (`aws-knowledge`, AWS-owned HTTPS, unpinned), and Spec-Driven Development (−7) flags a single phantom technology (Upstash Redis listed in architecture.md, not wired). The one persistent gap is **Quality Assurance 83% B** — no E2E test tier exists, the same `QA-04` FAIL as last audit.

## Dimension: Project Topology

**Score:** 100% — Grade **A**

| #   | Check                              | Severity | Status | Evidence                                                                                       |
| --- | ---------------------------------- | -------- | ------ | ---------------------------------------------------------------------------------------------- |
| 1   | Repository structure type          | medium   | PASS   | Monorepo — pnpm workspace: app `savepoint-tanstack` + Terraform `infra` + `scripts` tooling.   |
| 2   | Application layer inventory        | medium   | PASS   | Full-stack TanStack Start v1 + React 19 + Prisma 7 web app; Terraform IaC; Node/shell tooling. |
| 3   | Database and storage detection     | medium   | PASS   | PostgreSQL 16 (Prisma 7, 51 migrations, :6432); AWS S3 (`@aws-sdk/client-s3`, LocalStack).     |
| 4   | Infrastructure layer detection     | medium   | PASS   | Terraform (14 `.tf`, dev/prod, Cognito+S3); Docker Compose (postgres, pgadmin, localstack).    |
| 5   | Language inventory                 | medium   | PASS   | TypeScript dominant (822 ts + 445 tsx); Markdown 210; SQL 51; HCL 14.                          |
| 6   | Inter-layer communication patterns | medium   | PASS   | `createServerFn` RPC bridge; external REST via `src/shared/api/`. No proto/GraphQL/OpenAPI.    |

## Dimension: Code Architecture

**Score:** 100% — Grade **A**

| #   | Check                                       | Severity | Status | Evidence                                                                                          |
| --- | ------------------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------- |
| 1   | Declared/recognizable architectural pattern | high     | PASS   | FSD explicitly declared in `savepoint-tanstack/CLAUDE.md`; all 6 layers present under `src/`.      |
| 2   | Module boundaries respected                 | high     | PASS   | `eslint-plugin-boundaries` machine-enforces FSD; sampled graph shows 0 upward/cross-slice imports. |
| 3   | SRP — modules well-scoped                   | medium   | PASS   | 28 domain-named feature slices, 9 entity nouns; no god module; largest dir is shadcn `shared/ui`.  |
| 4   | Separation of concerns across layers        | high     | PASS   | Entity queries are pure Prisma data-access; 0 `prisma.` usage in `.tsx`; only component fetch is S3.|
| 5   | Consistent file/dir naming                  | medium   | PASS   | Uniform kebab-case, 0 deviations; 160 colocated `.test` files, no `__tests__/` dirs.               |
| 6   | Reasonable file sizes                       | medium   | PASS   | 0 of 821 non-test source files exceed 500 LOC; the only 4 files >500 are tests.                   |

## Dimension: Documentation Quality

**Score:** 100% — Grade **A** (+17)

| #   | Check                            | Severity | Status | Evidence                                                                                  |
| --- | -------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------- |
| 1   | Root README exists and is useful | critical | PASS   | Description, full getting-started, common commands; matches `package.json` scripts.       |
| 2   | Service-level READMEs exist      | high     | PASS   | `savepoint-tanstack/`, `infra/`, `scripts/` all have READMEs with build/run instructions. |
| 3   | API documentation                | high/med | SKIP   | Small closed internal API (`createServerFn` RPC, co-located client); no public surface.    |
| 4   | No stale documentation           | medium   | PASS   | All 5 sampled claims verified (port 6060, ports 6432/5050/4568, npm scripts, spec 021).    |

## Dimension: AI Development Tooling

**Score:** 100% — Grade **A**

| #   | Check                                   | Severity | Status | Evidence                                                                                |
| --- | --------------------------------------- | -------- | ------ | --------------------------------------------------------------------------------------- |
| 1   | CLAUDE.md ecosystem provides AI context | critical | PASS   | 5 CLAUDE.md + 10 path-scoped rule files: purpose, commands, C2 DAL, FSD rules, foot-guns.|
| 2   | Custom slash commands exist             | medium   | PASS   | 10 custom commands under `.claude/commands/awos/`.                                       |
| 3   | Skills are configured                   | low      | PASS   | 11 skills with valid `SKILL.md` frontmatter.                                             |
| 4   | MCP servers configured                  | low      | PASS   | `.mcp.json` defines 3 servers (awos-recruitment, terraform-mcp-server, aws-knowledge).   |
| 5   | Hooks are configured                    | low      | PASS   | Pre/PostToolUse hooks with present, executable scripts.                                  |
| 6   | CLAUDE.md files meaningful & structured | high     | PASS   | All files <200 lines (149/182/56/64/45); non-obvious, no bloat, no cross-level dup.       |
| 7   | Agent can run and observe the app       | critical | PASS   | Web UI observable via enabled `playwright` plugin; Terraform `terraform plan` dry-run.    |

## Dimension: Prompt & Agent Integrity

**Score:** 91% — Grade **A** (-9)

| #   | Check                                   | Severity | Status | Evidence                                                                                       |
| --- | --------------------------------------- | -------- | ------ | ---------------------------------------------------------------------------------------------- |
| 1   | No invisible/hidden Unicode             | critical | PASS   | Byte-level scan of 41 agent/skill/command/rule/CLAUDE.md files — zero invisible code points.    |
| 2   | No prompt-injection patterns            | critical | PASS   | No offensive patterns; sensitive-file mentions are all defensive guardrail instructions.        |
| 3   | Hook scripts safe                       | critical | PASS   | `check-sensitive-files.sh` (blocks secret reads) + `format-and-lint.sh`; no network/exfil.      |
| 4   | MCP endpoints trusted                   | critical | WARN   | `aws-knowledge-mcp-server` runs `uvx fastmcp run https://knowledge-mcp.global.api.aws` (unpinned).|
| 5   | Agent/config files have git provenance  | high     | PASS   | All critical configs + agent files tracked; only gitignored `settings.local.json` untracked.    |
| 6   | No security-bypass in skill/command files| critical | PASS   | No bypass patterns; no `$ARGUMENTS`-into-shell injection sinks.                                  |

## Dimension: Quality Assurance

**Score:** 83% — Grade **B** (+2)

| #   | Check                              | Severity | Status | Evidence                                                                                       |
| --- | ---------------------------------- | -------- | ------ | ---------------------------------------------------------------------------------------------- |
| 1   | Test infrastructure & coverage     | critical | PASS   | Vitest unit (jsdom, mocked Prisma) + integration (real PG, forked); 85% enforced coverage gate.  |
| 2   | Unit tier present                  | high     | PASS   | jsdom project, mocked Prisma singleton (`test/setup/unit.ts`); 160 colocated test files.         |
| 3   | Integration tier present           | high     | PASS   | `integration` project, real PostgreSQL :6432, per-test isolated DBs; 51 files in `test/integration/`.|
| 4   | E2E tier present                   | high     | FAIL   | No Playwright/Cypress/wdio config, no `e2e/` dir, no `*.e2e.test.*` anywhere.                    |
| 5   | Pyramid shape — no inversion       | medium   | PASS   | unit (160) ≥ integration (51) ≥ e2e (0); healthy non-inverted shape.                            |
| 6   | Coverage reporting configured      | low      | PASS   | v8 coverage with `statements: 85` threshold scoped to `src/{entities,features}`.                 |
| 7   | Test data management               | low      | PASS   | Per-file builder functions (`makeUser`, `makeGame`) + Prisma seed; structured, not inline.       |
| 8   | Test isolation — mocking infra     | medium   | PASS   | Native `vi.mock` in 93 files, `vi.fn`/`mockResolvedValue` in 117.                                |
| 9   | Contract testing                   | high     | SKIP   | Single web-app service; no inter-service contracts.                                              |
| 10  | ML model iteration testing         | high     | SKIP   | No ML frameworks in source.                                                                      |

## Dimension: Security Guardrails

**Score:** 100% — Grade **A**

| #   | Check                          | Severity | Status | Evidence                                                                                          |
| --- | ------------------------------ | -------- | ------ | ------------------------------------------------------------------------------------------------- |
| 1   | `.env` files gitignored        | critical | PASS   | `.env` family gitignored (root + service); only `.env.example` files tracked.                     |
| 2   | AI hooks restrict secret reads | critical | PASS   | PreToolUse `check-sensitive-files.sh` blocks (exit 2) `.env`/`*.pem`/`*.key`/credentials reads.    |
| 3   | `.env.example`/template exists | high     | PASS   | Placeholder-only templates at root and the service dir that uses env vars.                         |
| 4   | No secrets in committed files  | critical | PASS   | No real secrets; only `AKIA…` hits are inside prior audit files; rest are Terraform keys/placeholders.|
| 5   | Stack-relevant gitignore       | high     | PASS   | Covers TS/Node, Terraform, AWS/certs, macOS `.DS_Store`.                                          |

## Dimension: Software Best Practices

**Score:** 100% — Grade **A**

| #   | Check                          | Severity | Status | Evidence                                                                                  |
| --- | ------------------------------ | -------- | ------ | ----------------------------------------------------------------------------------------- |
| 1   | Linting configured & enforced  | high     | PASS   | `eslint.config.mjs`, `lint` script `--max-warnings 0`, enforced in CI.                     |
| 2   | Formatting automated           | medium   | PASS   | `prettier.config.mjs`, `format`/`format:check` scripts, `format:check` gated in CI.       |
| 3   | Type safety enforced           | high     | PASS   | `tsconfig.json` `strict: true`, `strictNullChecks`, `noImplicitOverride`; `tsc` in CI.    |
| 5   | CI/CD pipeline exists          | high     | PASS   | `pr-checks-tanstack.yml` (typecheck/lint/format/build/test) + `deploy.yml`.               |
| 6   | Error handling consistent      | high     | PASS   | Structured Prisma error mapping, log-and-rethrow, `AppError`/`getErrorMessage`, error-boundary.|
| 7   | Dependencies managed           | medium   | PASS   | `pnpm-lock.yaml` + `.github/dependabot.yml` (npm/terraform/github-actions weekly).        |

## Dimension: Spec-Driven Development

**Score:** 93% — Grade **A** (-7)

| #   | Check                                   | Severity | Status | Evidence                                                                                       |
| --- | --------------------------------------- | -------- | ------ | ---------------------------------------------------------------------------------------------- |
| 1   | AWOS installed and set up               | critical | PASS   | 10 commands in `.awos/commands/` + 10 wrappers in `.claude/commands/awos/`; context dirs exist. |
| 2   | Product context documents complete      | high     | PASS   | product-definition (100), roadmap (143), architecture (256) all substantive.                    |
| 3   | Architecture doc reflects codebase      | high     | WARN   | Single phantom: **Upstash Redis** ("optional") listed but no dependency or code reference.       |
| 4   | Features implemented through specs       | critical | PASS   | 57 feat commits touched `context/spec/**` in 3 months; specs 021/022/023 modified full triad.   |
| 5   | Spec directories structurally complete  | high     | PASS   | 20/22 dirs have full triad (91%); 1 partial (019), 1 skeleton (jewel-theme).                     |
| 6   | No stale or abandoned specs             | medium   | PASS   | 0 stale; no Approved/In-Review specs left mid-workflow.                                          |
| 7   | Tasks have meaningful agent assignments | medium   | PASS   | 93% of sub-tasks (1256/1348) annotated; specialist-dominant; QA on verification gates.           |

## Dimension: Supply Chain Security

**Score:** 94% — Grade **A** (+22)

| #   | Check                                | Severity | Status | Evidence                                                                                       |
| --- | ------------------------------------ | -------- | ------ | ---------------------------------------------------------------------------------------------- |
| 1   | Lockfiles committed to VC            | critical | PASS   | `pnpm-lock.yaml` tracked in git.                                                                |
| 2   | Lockfiles contain integrity hashes   | high     | PASS   | Sampled entries carry `integrity:` SHA-512 fields.                                              |
| 3   | No permissive version ranges         | high     | PASS   | Manifests use exact pins (per project pin-exact-versions discipline).                            |
| 4   | No recently published versions       | critical | PASS   | 40 sampled direct versions all >7 days old; prior `nitro` beta now 19 days old (resolved).       |
| 5   | Dependency review enforces approval  | high     | PASS   | Dependabot (no automerge) + CODEOWNERS gate; PR #348 unified the pnpm-workspace Dependabot config.|
| 6   | Vulnerability scanning in CI         | critical | PASS   | `pnpm audit` blocking on PRs (note: `--prod` scoped, devDeps not scanned).                       |
| 7   | Dependency overrides reviewed        | high     | WARN   | 14 `pnpm.overrides` exceed the 10+ maintenance-debt threshold; all exact-pinned, aged, documented.|
| 8   | Dependency count / attack surface    | medium   | PASS   | Ratio within healthy range for the ecosystem.                                                   |

## Dimension: End-to-End Delivery

**Score:** 92% — Grade **A** (-1)

| #   | Check                          | Severity | Status | Evidence                                                                                       |
| --- | ------------------------------ | -------- | ------ | ---------------------------------------------------------------------------------------------- |
| 1   | Cross-layer feature branches   | high     | PASS   | Every substantive feature PR (#345/#344/#342/#242/#317) spans DB→API/DAL→UI in one branch.       |
| 2   | No layer-split branching       | medium   | PASS   | No `*-backend`/`*-frontend` pairs; CLAUDE.md mandates single-branch cross-layer changes.          |
| 3   | Spec-to-delivery traceability  | high     | PASS   | Bidirectional: commits cite spec numbers; tasks.md `[x]` items track delivery (023: 40, 022: 19).|
| 4   | No orphaned artifacts          | medium   | WARN   | 4 Prisma tables (`Review`, `Genre`, `GameGenre`, `IgnoredImportedGames`) have no query layer.    |
| 5   | Shared ownership enablers      | medium   | PASS   | Root `Makefile`, `docker-compose.yml`, `pnpm-workspace.yaml`, shared CI → unified `make dev`.    |

## Top Recommendations

| #   | Priority | Effort | Dimension                | Recommendation                                                                                          |
| --- | -------- | ------ | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| 1   | P1       | Medium | Quality Assurance        | Add an E2E tier (Playwright) covering auth → add-game → library; the only non-A dimension (QA-04 FAIL).  |
| 2   | P1       | Low    | Prompt & Agent Integrity | Pin/vendor the `aws-knowledge` MCP server instead of remote `uvx fastmcp run https://…` fetch-and-run.   |
| 3   | P2       | Low    | Spec-Driven Development   | Resolve the Upstash Redis phantom: wire it up or drop it from `context/product/architecture.md`.         |
| 4   | P2       | Low    | End-to-End Delivery      | Prune or wire the 4 orphaned Prisma tables (`Review` appears superseded by `JournalEntry`).              |
| 5   | P2       | Low    | Supply Chain Security    | Trim `pnpm.overrides` (14 → <10) as upstream fixes land; or document why the count is sustained.          |
| 6   | P2       | Low    | Supply Chain Security    | Broaden CI `pnpm audit` beyond `--prod` so devDependencies are also vuln-scanned.                        |
