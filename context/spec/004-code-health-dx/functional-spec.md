# Functional Specification: Code Health & Developer Experience

- **Roadmap Item:** Code Health & Developer Experience (Audit: 2026-03-25 — Score 73% Grade C)
- **Status:** Completed
- **Author:** Nail

---

## 1. Overview and Rationale (The "Why")

On 2026-03-25, a code health audit scored the SavePoint codebase at **73% (Grade C)**. The weakest dimensions were AI Development Tooling (33%, Grade F), End-to-End Delivery (50%, Grade D), Code Architecture (67%, Grade C), and Security Guardrails (69%, Grade C). These gaps mean:

- **AI agents cannot verify UI changes** — no browser MCP is configured, so visual regressions go unnoticed during AI-assisted development.
- **Sensitive files are unprotected** — no hooks prevent AI tools from reading `.env`, private keys, or credential files.
- **AI context is incomplete** — two of three service directories (lambdas-py, infra) have zero CLAUDE.md files, and existing ones are bloated beyond useful limits.
- **Architectural boundaries are leaking** — feature-layer code imports Prisma client types directly, and DAL handlers import from the features layer (reverse dependency).
- **Documentation is stale** — README files reference nonexistent directories and the wrong package manager.
- **Dependencies lack automated updates** — no Dependabot or Renovate is configured.

**Desired outcome:** Raise the overall audit score to **80%+ (Grade B)** by resolving all critical and high-severity findings and addressing medium-severity items where practical.

**Success metric:** A re-audit using the same checklist produces a score of 80% or higher, with no critical findings remaining.

---

## 2. Functional Requirements (The "What")

This work is delivered in three phases corresponding to priority tiers. Each phase must be fully completed before the next begins.

### Phase 1: P0 — Immediate Fixes

These address critical and high-severity findings that pose security or workflow risks.

#### 2.1 Add Playwright MCP for UI verification (AI-07)

- Add a Playwright-based MCP server to `.mcp.json` so AI agents can visually verify Next.js UI changes.
- **Acceptance Criteria:**
  - [x] `.claude/settings.json` enables Playwright plugin (`playwright@claude-plugins-official: true`).
  - [x] An AI agent can launch a browser, navigate to the local Next.js app, and capture a screenshot via MCP tools.

#### 2.2 Add PreToolUse security hooks (SEC-02)

- Add hooks in `.claude/settings.json` that block AI agent `Read`, `Glob`, and `Bash` access to sensitive file patterns: `.env`, `.env.local`, `.env.production`, `*.pem`, `*.key`, `credentials*`, `secrets*`, `*.p12`, `*.pfx`.
- **Acceptance Criteria:**
  - [x] `.claude/settings.json` contains a `PreToolUse` hook configuration targeting `Read`, `Glob`, `Edit`, `Write`, `Grep`, and `Bash` tools.
  - [x] The hook blocks access to all listed sensitive file patterns.
  - [x] Attempting to read a `.env` file via an AI agent triggers the hook and is denied.

#### 2.3 Add *.key to root .gitignore (SEC-05)

- Add the `*.key` glob pattern to the root `.gitignore` to prevent accidental commits of TLS private keys.
- **Acceptance Criteria:**
  - [x] Root `.gitignore` contains `*.key` pattern.
  - [x] Running `git check-ignore test.key` from the repo root confirms the pattern matches.

### Phase 2: P1 — Fix Soon

These address high and medium-severity findings that degrade AI effectiveness and documentation accuracy.

#### 2.4 Trim CLAUDE.md files to <200 lines (AI-06)

- Reduce all CLAUDE.md files to under 200 lines each. Remove: directory tree listings, code template examples, tutorial-style prose, and content duplicated across files. Apply the test: "Would removing this line cause Claude to make mistakes?" If not, cut it.
- **Acceptance Criteria:**
  - [x] Every CLAUDE.md file in the repository is under 200 lines.
  - [x] No essential project conventions, commands, or gotchas are lost (verified by reviewing diffs).

#### 2.5 Add CLAUDE.md for lambdas-py/ and infra/ (AI-01)

- Create CLAUDE.md files for the two service directories that currently have zero AI context. Each file should include: project purpose, key commands (build, test, deploy), non-obvious conventions, and gotchas.
- **Acceptance Criteria:**
  - [x] `lambdas-py/CLAUDE.md` exists and is under 200 lines.
  - [x] `infra/CLAUDE.md` exists and is under 200 lines.
  - [x] Each file documents at minimum: purpose, build/test/deploy commands, and key conventions.

#### 2.6 Fix stale README claims (DOC-04)

- Correct three documented inaccuracies:
  1. Root README says "two top-level modules" — update to include lambdas-py.
  2. savepoint-app README lists nonexistent feature directories (add-game/, steam-integration/, view-collection/) — update to reflect actual directory names.
  3. savepoint-app README references Bun — replace with pnpm.
- **Acceptance Criteria:**
  - [x] Root README accurately lists all three service directories.
  - [x] savepoint-app README feature directory list matches actual `features/` contents.
  - [x] No references to "Bun" remain in any README; replaced with "pnpm".

#### 2.7 Move library-status-redesign spec to context/spec/ (SDD-04)

- Relocate the library-status-redesign specification from `docs/superpowers/` to the AWOS-standard location at `context/spec/NNN-library-status-redesign/`.
- **Acceptance Criteria:**
  - [x] Spec files exist under `context/spec/` in the standard directory structure.
  - [x] The original location no longer contains the spec (or redirects to the new location).
  - [x] Any internal links referencing the old path are updated.

### Phase 3: P2 — Improve When Possible

These are medium-severity improvements to architecture, documentation, and dependency management.

#### 2.8 Split igdb-service.unit.test.ts (ARCH-06)

- Split the 3260-line test file into focused test suites organized by method or concern (e.g., search tests, game detail tests, platform tests).
- **Acceptance Criteria:**
  - [x] `igdb-service.unit.test.ts` no longer exists as a single file, or is under 2000 lines.
  - [x] All original tests pass in their new locations.
  - [x] Each new test file covers a coherent subset of functionality.

#### 2.9 Fix DAL->features reverse imports and @prisma/client leakage (ARCH-02/04)

- Address two architectural boundary violations:
  1. **Reverse imports:** DAL handlers import from the features layer. Move shared schemas/types to DAL or shared layer.
  2. **Prisma leakage:** Feature files import `@prisma/client` types directly. Replace with domain types from the DAL or shared types.
- **Acceptance Criteria:**
  - [x] No file in `data-access-layer/` imports from `features/`.
  - [x] No file in `features/` imports from `@prisma/client`.
  - [x] All existing tests pass after the refactoring.

#### 2.10 Configure Dependabot for automated dependency updates (SBP-07)

- Add a GitHub Dependabot configuration to automate dependency update PRs for all three service directories.
- **Acceptance Criteria:**
  - [x] `.github/dependabot.yml` exists with update configurations for savepoint-app (npm), lambdas-py (pip), and infra (terraform).
  - [ ] Dependabot creates at least one test PR after configuration is merged to main. _(Deferred: requires merge to main)_

---

## 3. Scope and Boundaries

### In-Scope

- All 10 sub-tasks listed above, organized into three priority phases.
- Re-audit after Phase 3 to verify the 80%+ target is met.
- Updating any internal cross-references broken by file moves.

### Out-of-Scope

- **Steam Library Integration** — separate roadmap item with its own spec.
- **PlayStation Trophy Integration** — separate roadmap item.
- **Xbox Game Pass Integration** — separate roadmap item.
- **Discovery & Exploration** — separate roadmap item.
- **Curated Collections** — separate roadmap item.
- **Community & Social Features** — Phase 3 roadmap items.
- **Cross-layer branching practice (E2E-01)** — audit recommendation not included in this roadmap item; it is an ongoing practice change, not a discrete deliverable.
- **New feature development** — this spec is strictly about code health improvements.
