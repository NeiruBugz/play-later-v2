# Audit Recommendations — 2026-03-25

## P0 — Fix Immediately

### 1. Add browser MCP for UI verification

- **Dimension:** AI Development Tooling
- **Check:** AI-07
- **Effort:** Low
- **Details:** Add Playwright MCP server to `.mcp.json`. The primary application is a Next.js web UI — without a browser MCP, the agent cannot visually verify any UI changes. Install `@anthropic/mcp-playwright` or equivalent and configure in `.mcp.json`.

### 2. Add AI agent security hooks

- **Dimension:** Security Guardrails
- **Check:** SEC-02
- **Effort:** Low
- **Details:** Add `PreToolUse` hooks in `.claude/settings.json` to block `Read`, `Glob`, and `Bash` access to sensitive file patterns: `.env`, `.env.local`, `.env.production`, `*.pem`, `*.key`, `credentials*`, `secrets*`, `*.p12`, `*.pfx`. Example hook structure:
  ```json
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read|Glob|Bash",
        "command": "check-sensitive-patterns.sh"
      }
    ]
  }
  ```

## P1 — Fix Soon

### 3. Trim CLAUDE.md files to <200 lines

- **Dimension:** AI Development Tooling
- **Check:** AI-06
- **Effort:** Medium
- **Details:** 5 of 9 CLAUDE.md files exceed 200 lines (up to 345). The root copy is 899 lines. Remove: directory tree listings, code template examples, tutorial-style prose, architecture diagrams duplicated across files. Apply the key test: "Would removing this line cause Claude to make mistakes?" If not, cut it.

### 4. Add CLAUDE.md for lambdas-py/ and infra/

- **Dimension:** AI Development Tooling
- **Check:** AI-01
- **Effort:** Low
- **Details:** lambdas-py/ and infra/ have zero AI context files. Create CLAUDE.md for each with: project purpose, key commands (build, test, deploy), non-obvious conventions, and gotchas. Keep under 200 lines each.

### 5. Use context/spec/ for all feature specs

- **Dimension:** Spec-Driven Development
- **Check:** SDD-04
- **Effort:** Low
- **Details:** The library-status-redesign spec was placed in `docs/superpowers/` outside the AWOS structure. Future feature specs should go in `context/spec/NNN-feature-name/` with the full triad (functional-spec.md, technical-considerations.md, tasks.md). Consider moving the existing spec.

### 6. Deliver cross-layer features in single branches

- **Dimension:** End-to-End Delivery
- **Check:** E2E-01
- **Effort:** Medium
- **Details:** Only ~20% of feature branches touch multiple service directories. When a feature requires changes across savepoint-app, lambdas-py, or infra, include all changes in a single feature branch rather than separate commits/branches per layer.

## P2 — Improve When Possible

### 7. Split igdb-service.unit.test.ts

- **Dimension:** Code Architecture
- **Check:** ARCH-06
- **Effort:** Low
- **Details:** `data-access-layer/services/igdb/igdb-service.unit.test.ts` is 3260 lines — exceeds the 2000-line absolute limit. Split into focused test suites by method or concern (e.g., `igdb-search.unit.test.ts`, `igdb-game-detail.unit.test.ts`).

### 8. Fix stale README claims

- **Dimension:** Documentation Quality
- **Check:** DOC-04
- **Effort:** Low
- **Details:** Three inaccurate claims found:
  - Root README says "two top-level modules" — add lambdas-py
  - savepoint-app README lists nonexistent feature dirs (add-game/, steam-integration/, view-collection/) — update to actual dirs
  - savepoint-app README references Bun — replace with pnpm

### 9. Fix architectural boundary violations

- **Dimension:** Code Architecture
- **Check:** ARCH-02, ARCH-04
- **Effort:** Medium
- **Details:** (a) DAL handlers import from features layer (reverse dependency) — move shared schemas/use-cases to DAL or shared layer. (b) 5 steam-import files import `@prisma/client` types directly — use domain types instead. (c) 2 use-cases bypass service layer to access repository — route through services.

### 10. Add *.key to .gitignore

- **Dimension:** Security Guardrails
- **Check:** SEC-05
- **Effort:** Low
- **Details:** Add `*.key` glob pattern to the root `.gitignore` file. Currently `*.pem` is covered but `*.key` (TLS private keys) is not.
