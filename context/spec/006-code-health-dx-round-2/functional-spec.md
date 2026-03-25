# Functional Specification: Code Health & Developer Experience (Round 2)

- **Roadmap Item:** Code Health & Developer Experience (Round 2) _(Audit: 2026-03-25 — Score 77% Grade B)_
- **Status:** Draft
- **Author:** Nail

---

## 1. Overview and Rationale (The "Why")

The 2026-03-25 code audit scored SavePoint at **77% (Grade B)**, up from 73% (Grade C). Two dimensions remain at **Grade D**: AI Development Tooling (48%) and End-to-End Delivery (50%). Security Guardrails sit at Grade C (69%).

The root cause is that AI agents opening this repository have no top-level orientation — no root CLAUDE.md explains what SavePoint is, how the three services relate, or how to run the app. Secondary issues include architectural boundary violations, incomplete .gitignore coverage, stale documentation, and a lack of cross-layer development tooling.

**Problem:** Without these fixes, AI agents produce lower-quality output (wrong assumptions about project structure), developers waste time discovering how to run the app, and the monorepo's three layers (savepoint-app, lambdas-py, infra) operate as disconnected silos rather than a unified product.

**Desired outcome:** Raise the overall audit score to 85%+ (Grade B+) by addressing all 10 recommendations. Specifically, bring AI Development Tooling above 75% and End-to-End Delivery above 60%.

**Success metrics:**
- Re-run `/awos:audit` after completion → overall score >= 85%
- AI Development Tooling dimension >= 75% (Grade B)
- End-to-End Delivery dimension >= 60% (Grade C)
- Zero P0 findings in the next audit

---

## 2. Functional Requirements (The "What")

### 2.1 P0 — Immediate Fixes

#### REQ-01: Create root CLAUDE.md _(AI-01)_

A root `CLAUDE.md` must exist at the repository root providing AI agents with top-level project orientation.

- **Acceptance Criteria:**
  - [ ] `CLAUDE.md` exists at the repository root
  - [ ] Contains project purpose statement (what SavePoint is)
  - [ ] Contains cross-service architecture overview (how savepoint-app, lambdas-py, and infra relate, including SQS/S3/shared DB communication)
  - [ ] Contains key commands for each layer (dev, test, lint, build)
  - [ ] Contains git workflow and branching conventions
  - [ ] Contains CI pipeline overview (which workflows run, what they check)
  - [ ] File is under 200 lines
  - [ ] Does not duplicate content already in service-level CLAUDE.md files

### 2.2 P1 — Fix Soon

#### REQ-02: Add dev server run instructions _(AI-07)_

AI agents must be able to discover how to start and observe the application from CLAUDE.md files.

- **Acceptance Criteria:**
  - [ ] Root CLAUDE.md or savepoint-app CLAUDE.md documents how to start the Next.js dev server (`pnpm dev` or equivalent)
  - [ ] Required environment variables for local development are listed (or references `.env.example`)
  - [ ] Database setup steps are documented (docker-compose up, migrations)
  - [ ] Lambda local testing approach is documented (uv run pytest, or equivalent)

#### REQ-03: Spec-first workflow documented _(SDD-04)_

The project must establish and document a spec-first workflow expectation for new features.

- **Acceptance Criteria:**
  - [ ] Root CLAUDE.md contains a section stating that new features require a spec in `context/spec/` before implementation begins
  - [ ] The section explains the AWOS spec workflow: `/awos:spec` → `/awos:tech` → `/awos:tasks` → `/awos:implement`
  - [ ] Feature branches with `feat/` prefix are expected to reference their spec directory in the first commit message

#### REQ-04: Generate tasks.md for spec 005 _(SDD-05)_

The library-status-redesign spec must have its task breakdown completed.

- **Acceptance Criteria:**
  - [ ] `context/spec/005-library-status-redesign/tasks.md` exists
  - [ ] Contains task breakdown generated via `/awos:tasks`
  - [ ] Sub-tasks have agent assignments in `**[Agent: agent-name]**` format

#### REQ-05: Cross-layer branch expectation documented _(E2E-01)_

The project must document that features spanning multiple layers should be delivered in a single branch.

- **Acceptance Criteria:**
  - [ ] Root CLAUDE.md documents that feature branches should include all affected layers (savepoint-app, lambdas-py, infra) in a single branch
  - [ ] Explicitly states: do not split features into separate per-layer branches

### 2.3 P2 — Improve When Possible

#### REQ-06: Fix repository bypass violations _(ARCH-02)_

Three files that import directly from `@/data-access-layer/repository` must be refactored to use the service layer.

- **Acceptance Criteria:**
  - [ ] `features/steam-import/use-cases/import-game-to-library.ts` imports from services, not repository
  - [ ] `features/journal/server-actions/get-games-by-ids.ts` imports from services, not repository
  - [ ] `app/(protected)/journal/page.tsx` imports from services, not repository
  - [ ] No source file outside `data-access-layer/` imports from `@/data-access-layer/repository` directly
  - [ ] All existing tests pass after refactoring

#### REQ-07: Clean CLAUDE.md files _(AI-06)_

CLAUDE.md files must contain only non-obvious, high-value content.

- **Acceptance Criteria:**
  - [ ] Directory tree listings removed from `app/CLAUDE.md`
  - [ ] Directory tree listings removed from `data-access-layer/CLAUDE.md`
  - [ ] Template/tutorial code removed from handler and service CLAUDE.md files
  - [ ] Duplicated import rules between DAL parent and sub-layer files consolidated
  - [ ] All CLAUDE.md files remain under 200 lines each

#### REQ-08: Expand .gitignore coverage _(SEC-05)_

Sensitive file patterns relevant to the project stack must be covered by .gitignore.

- **Acceptance Criteria:**
  - [ ] Root `.gitignore` contains `*.p12` pattern
  - [ ] Root `.gitignore` contains `*.pfx` pattern
  - [ ] Root `.gitignore` contains `credentials*` pattern
  - [ ] Root `.gitignore` contains `secrets*` pattern

#### REQ-09: Fix stale documentation _(DOC-02, DOC-04)_

Documentation must accurately reflect the current codebase.

- **Acceptance Criteria:**
  - [ ] Dead link to `./documentation/` removed or fixed in `savepoint-app/README.md` (around line 492)
  - [ ] `scripts/` directory has a `README.md` describing the shell utilities it contains
  - [ ] README.md content verified against actual file structure

#### REQ-10: Add root-level cross-layer tooling _(E2E-05)_

Developers must be able to operate across all layers from the repository root.

- **Acceptance Criteria:**
  - [ ] A root `Makefile` or `Taskfile` exists with at minimum: `dev` (start all layers), `test` (run all test suites), `lint` (lint all layers)
  - [ ] `.github/workflows/pr-checks.yml` validates lambdas-py (ruff check, mypy, pytest) in addition to savepoint-app
  - [ ] Running the root `test` command executes tests for both savepoint-app and lambdas-py

---

## 3. Scope and Boundaries

### In-Scope

- All 10 audit recommendations from `context/audits/2026-03-25/recommendations.md`
- Creating and editing CLAUDE.md files (root + cleanup of existing)
- Refactoring 3 files to fix architectural boundary violations
- Editing .gitignore, README.md files, and CI workflow
- Creating a root Makefile/Taskfile
- Generating tasks.md for spec 005 via AWOS workflow
- Documenting process expectations (spec-first workflow, cross-layer branches)

### Out-of-Scope

- Steam Library Integration (separate roadmap item)
- PlayStation Trophy Integration (separate roadmap item)
- Xbox Game Pass Integration (separate roadmap item)
- Discovery & Exploration features (separate roadmap item)
- Curated Collections (separate roadmap item)
- Community & Social Features (Phase 3)
- Application-level security fixes (SQL injection, XSS — not flagged in audit)
- Upgrading dependencies or frameworks
- Any user-facing feature changes
