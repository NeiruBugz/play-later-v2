# Audit Recommendations — 2026-05-12

## P0 — Fix Immediately

### 1. Add dependency vulnerability scanning to CI

- **Dimension:** Supply Chain Security
- **Check:** SCS-06
- **Effort:** Low
- **Details:** Zero vulnerability scanning across all 5 GitHub Actions workflows. Add a step to `.github/workflows/pr-checks.yml`:
  - Minimum: `- run: pnpm audit --prod --audit-level=high` after `pnpm install`
  - Preferred: `actions/dependency-review-action@v4` on PR events, plus a scheduled weekly `pnpm audit` job that opens an issue on findings
  - Consider Trivy or Socket.dev for deeper supply-chain insight

## P1 — Fix Soon

### 2. Fix stale infra references in root docs

- **Dimension:** Documentation Quality
- **Check:** DOC-01, DOC-04
- **Effort:** Low
- **Details:**
  - `README.md:10` and `CLAUDE.md:12` still claim "RDS, ECS, ECR, SQS, Secrets Manager" but `infra/` only ships `cognito` + `s3` modules
  - Neither file mentions `savepoint-tanstack/` (active migration target per spec 021)
  - Root `CLAUDE.md` references `CONTEXT-MAP.md` and per-layer `CONTEXT.md` files that do not exist — either create them or remove the references
  - This regression was flagged in the April audit and is unresolved

### 3. Rename tracked `.env.test` to template form

- **Dimension:** Security Guardrails
- **Check:** SEC-01
- **Effort:** Low
- **Details:** `savepoint-app/.env.test` is tracked under a non-template name. Contents are placeholders only, but the convention is `.env.test.example` or `.env.test.template`. Rename, update any Vitest config that loads it, and remove from git history if needed.

### 4. Extend Dependabot to `savepoint-tanstack/` and add CODEOWNERS

- **Dimension:** Supply Chain Security
- **Check:** SCS-05
- **Effort:** Low
- **Details:** Add a `package-ecosystem: npm, directory: /savepoint-tanstack` block to `.github/dependabot.yml`. Create a root `CODEOWNERS` file so dependency PRs are auto-routed for review. Verify branch protection requires CODEOWNERS review on `main`.

### 5. Tighten `pnpm.overrides`

- **Dimension:** Supply Chain Security
- **Check:** SCS-07
- **Effort:** Medium
- **Details:** Root `pnpm.overrides` has 14 entries (above the 10-package threshold) and 2 use open-ended ranges:
  - `rollup: ">=4.59.0"` — pin to current resolved version
  - `fast-xml-parser: ">=5.3.8"` — pin to current resolved version
  Create `docs/dependency-overrides.md` documenting why each override exists (CVE patch, peer-dep conflict, etc.) so future maintainers can prune.

### 6. Fix FSD layer violations in savepoint-app features

- **Dimension:** Code Architecture
- **Check:** ARCH-02
- **Effort:** Low
- **Details:** Four files import `@/widgets/game-card` from inside the features layer, violating the documented rule in `features/CLAUDE.md`. Files:
  - `features/browse-related-games/ui/related-games.tsx`
  - `features/game-search/ui/game-card.tsx`
  - `features/journal/ui/journal-entry-card.tsx`
  - `features/journal/ui/journal-timeline.tsx`
  Move the shared piece to `entities/game/ui/` or `shared/ui/`, then update imports.

### 7. Reconcile `context/product/architecture.md` with current codebase

- **Dimension:** Spec-Driven Development
- **Check:** SDD-03
- **Effort:** Medium
- **Details:** The architecture spec omits `savepoint-tanstack/` despite spec 021 being the active migration, and lists an ECS/RDS/ALB/VPC stack that the live `infra/` does not ship. Either:
  - Update the spec to reflect current reality (Cognito + S3 only) and document the TanStack migration, OR
  - Add a "Target State" header to make clear the ECS/RDS section is forward-looking, not current

### 8. Raise unit-test linkage ratio

- **Dimension:** Quality Assurance
- **Check:** QA-01
- **Effort:** High
- **Details:** ~22% test-to-source ratio (250 tests vs ~1,142 source files) is well below the 60% threshold. Prioritize:
  - DAL services (`data-access-layer/services/`) — business logic with branching
  - Feature use-cases (`features/*/use-cases/`) — orchestration of services
  - Skip generated Prisma models when measuring
  Track as an explicit roadmap item; aim for a 5pp/quarter improvement.

## P2 — Improve When Possible

### 9. Add coverage thresholds to gate CI

- **Dimension:** Quality Assurance
- **Check:** QA-06
- **Effort:** Low
- **Details:** Add a `coverage.thresholds` block in `savepoint-app/vitest.coverage.config.ts` to fail CI on regressions (start at current baseline, ratchet up). Add coverage config to `savepoint-tanstack/` (none exists today).

### 10. Split oversized CLAUDE.md files

- **Dimension:** AI Development Tooling
- **Check:** AI-06
- **Effort:** Medium
- **Details:**
  - `savepoint-tanstack/CLAUDE.md` is 484 LOC (target ≤200) — split by area (data access, routing, server functions, foot-guns)
  - `savepoint-app/data-access-layer/CLAUDE.md` is 224 LOC — minor trim or move detail into nested layer docs

### 11. Pin or replace `aws-knowledge-mcp-server` MCP entry

- **Dimension:** Prompt & Agent Integrity
- **Check:** PAI-04
- **Effort:** Low
- **Details:** `.mcp.json` uses `uvx fastmcp run https://knowledge-mcp.global.api.aws` — generic runner with a remote URL. Domain is AWS-owned and HTTPS-only, but the shape doesn't match standard MCP server conventions. Pin a `fastmcp` version or migrate to a typed `http` MCP server entry once one is published.

### 12. Wire `husky` pre-commit to `lint-staged`

- **Dimension:** Software Best Practices
- **Check:** SBP-02 (informational; not a deduction)
- **Effort:** Low
- **Details:** CI catches lint/format already, but local pre-commit feedback shortens the loop. Add a `.husky/pre-commit` that runs `pnpm exec lint-staged`.

### 13. Lift cross-layer scripts to root

- **Dimension:** End-to-End Delivery
- **Check:** E2E-05
- **Effort:** Medium
- **Details:** Makefile targets only `savepoint-app/`; root `package.json` has no scripts. Add root scripts that fan out to both apps (`pnpm -r test`, `pnpm -r typecheck`, `pnpm -r lint`) so cross-layer work has obvious entry points.

### 14. Complete spec 019

- **Dimension:** Spec-Driven Development
- **Check:** SDD-05
- **Effort:** Low
- **Details:** Spec 019 has substantive Draft content but no `tasks.md`. Either run `/awos:tasks` to generate one, or mark the spec as Deferred/Abandoned with a one-line note.

### 15. Bring lockfile entry count back below 1,000

- **Dimension:** Supply Chain Security
- **Check:** SCS-08
- **Effort:** High
- **Details:** 2,321 lockfile entries is inflated by parallel `savepoint-app/` + `savepoint-tanstack/` workspaces during the spec 021 migration. Will resolve naturally when migration completes and savepoint-app is retired — track but don't act yet.
