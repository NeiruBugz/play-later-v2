# Audit Recommendations — 2026-03-25

## P0 — Fix Immediately

### 1. Create root CLAUDE.md

- **Dimension:** AI Development Tooling
- **Check:** AI-01
- **Effort:** Low
- **Details:** No root CLAUDE.md exists. Create one with: project purpose ("SavePoint is a game library management app"), cross-service architecture overview (how savepoint-app, lambdas-py, and infra relate), key commands (build, test, lint, dev for each layer), git workflow, and CI notes. This is the single highest-impact fix — without it, AI agents have no top-level orientation.

## P1 — Fix Soon

### 2. Add dev server run instructions to CLAUDE.md

- **Dimension:** AI Development Tooling
- **Check:** AI-07
- **Effort:** Low
- **Details:** No CLAUDE.md file documents how to start the Next.js dev server (`pnpm dev`), required env vars, or database setup steps. Add these to root or savepoint-app CLAUDE.md so the agent can start and observe the application.

### 3. Create specs for new features before implementation

- **Dimension:** Spec-Driven Development
- **Check:** SDD-04
- **Effort:** Low
- **Details:** Only 50% of feature branches correlate with spec activity. Three recent features (auth migration, images, username-validation) were built without specs. Use `/awos:spec` for new features to reach the 70%+ target.

### 4. Generate tasks.md for spec 005-library-status-redesign

- **Dimension:** Spec-Driven Development
- **Check:** SDD-05
- **Effort:** Low
- **Details:** `context/spec/005-library-status-redesign/` has functional-spec.md and technical-considerations.md but is missing tasks.md. Run `/awos:tasks` to complete the triad.

### 5. Include cross-layer changes in feature branches

- **Dimension:** End-to-End Delivery
- **Check:** E2E-01
- **Effort:** Low
- **Details:** Only 15% of feature branches touch multiple service directories. When features require infrastructure or Lambda changes (e.g., new SQS queue, new Lambda handler, Terraform resource), include those changes in the same feature branch rather than separate commits on main.

## P2 — Improve When Possible

### 6. Fix repository bypass violations

- **Dimension:** Code Architecture
- **Check:** ARCH-02
- **Effort:** Low
- **Details:** Three files import directly from `@/data-access-layer/repository` bypassing the service layer: `features/steam-import/use-cases/import-game-to-library.ts`, `features/journal/server-actions/get-games-by-ids.ts`, and `app/(protected)/journal/page.tsx`. Route these through DAL services as documented in the DAL CLAUDE.md.

### 7. Clean up CLAUDE.md files

- **Dimension:** AI Development Tooling
- **Check:** AI-06
- **Effort:** Low
- **Details:** Remove directory tree listings in `app/CLAUDE.md` (lines 15-33) and `data-access-layer/CLAUDE.md` (lines 39-71). Remove template/tutorial code from handler and service CLAUDE.md files. Deduplicate import rules between DAL parent and sub-layer files.

### 8. Expand .gitignore coverage

- **Dimension:** Security Guardrails
- **Check:** SEC-05
- **Effort:** Low
- **Details:** Add `*.p12`, `*.pfx`, `credentials*`, `secrets*` patterns to .gitignore. These are currently covered by AI agent hooks but not by git itself.

### 9. Fix stale documentation

- **Dimension:** Documentation Quality
- **Checks:** DOC-02, DOC-04
- **Effort:** Low
- **Details:** Remove dead link to `./documentation/` at line 492 of `savepoint-app/README.md`. Add a brief README.md to `scripts/` describing the shell utilities.

### 10. Add root-level cross-layer tooling

- **Dimension:** End-to-End Delivery
- **Check:** E2E-05
- **Effort:** Medium
- **Details:** Create a root `Makefile` or `Taskfile` with unified commands: `dev` (start all layers), `test` (run all test suites), `lint` (lint all layers). Extend `pr-checks.yml` to also validate lambdas-py (ruff, mypy, pytest). Consider adding lambdas-py and infra to pnpm-workspace or using a polyglot task runner.
