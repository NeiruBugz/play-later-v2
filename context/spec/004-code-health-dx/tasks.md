# Tasks: Code Health & Developer Experience

## Phase 1: P0 — Immediate Fixes

- [x] **Slice 1: Add Playwright MCP for UI verification**
  - [x] Add `plugin:playwright:playwright` entry to `.mcp.json` alongside existing `awos-recruitment` entry. **[Agent: claude-code-guide]**
  - [x] Verify: Start a new Claude Code session, confirm Playwright MCP tools are available and can take a screenshot of a page. **[Agent: general-purpose]**

- [x] **Slice 2: Add PreToolUse security hooks**
  - [x] Create `.claude/hooks/check-sensitive-files.sh` — script that checks tool arguments against sensitive patterns (`.env`, `.env.local`, `.env.production`, `*.pem`, `*.key`, `credentials*`, `secrets*`, `*.p12`, `*.pfx`). Must allow `.env.example` and `.env.test`. **[Agent: claude-code-guide]**
  - [x] Add `hooks.PreToolUse` configuration to `.claude/settings.json` targeting `Read`, `Glob`, `Edit`, `Write`, and `Bash` tools, pointing to the hook script. **[Agent: claude-code-guide]**
  - [x] Verify: In a Claude Code session, attempt to read a `.env` file — hook should deny. Attempt to read `.env.example` — hook should allow. **[Agent: general-purpose]**

- [x] **Slice 3: Add *.key to .gitignore**
  - [x] Add `*.key` pattern to root `.gitignore` in the security-sensitive section near existing `.env` patterns. **[Agent: general-purpose]**
  - [x] Verify: Run `git check-ignore test.key` — must return a match. **[Agent: general-purpose]**

## Phase 2: P1 — Documentation

- [x] **Slice 4: Trim CLAUDE.md files to <200 lines**
  - [x] Trim `savepoint-app/features/CLAUDE.md` (345→64 lines). **[Agent: claude-code-guide]**
  - [x] Trim `savepoint-app/data-access-layer/repository/CLAUDE.md` (333→56 lines). **[Agent: claude-code-guide]**
  - [x] Trim `savepoint-app/shared/CLAUDE.md` (273→59 lines). **[Agent: claude-code-guide]**
  - [x] N/A: `savepoint-app/data-access-layer/domain/CLAUDE.md` does not exist (audit data was incorrect). **[Agent: claude-code-guide]**
  - [x] Trim `savepoint-app/test/CLAUDE.md` (292→80 lines). **[Agent: claude-code-guide]**
  - [x] Verify: All 8 CLAUDE.md files are under 200 lines (max: 190 lines for data-access-layer/CLAUDE.md). **[Agent: general-purpose]**

- [x] **Slice 5: Add CLAUDE.md for lambdas-py/ and infra/**
  - [x] Create `lambdas-py/CLAUDE.md` (76 lines) documenting: purpose, Python version, key commands, Lambda function inventory, conventions. **[Agent: python-architect]**
  - [x] Create `infra/CLAUDE.md` (73 lines) documenting: purpose, Terraform version, key commands, module inventory, environment structure, state backend. **[Agent: terraform-infrastructure]**
  - [x] Verify: Both files under 200 lines. **[Agent: general-purpose]**

- [x] **Slice 6: Fix stale README claims**
  - [x] Update root `README.md` to list all 3 service directories (savepoint-app, lambdas-py, infra). **[Agent: general-purpose]**
  - [x] Update `savepoint-app/README.md`: replace all "Bun" references with "pnpm"; update feature directory listing to match actual `features/` contents. **[Agent: general-purpose]**
  - [x] Verify: `grep -ri "bun" savepoint-app/README.md` returns no results; feature dirs listed match `ls savepoint-app/features/`. **[Agent: general-purpose]**

- [x] **Slice 7: Move library-status-redesign spec to context/spec/**
  - [x] Run `.awos/scripts/create-spec-directory.sh library-status-redesign` to create the target directory. **[Agent: general-purpose]**
  - [x] Copy `docs/superpowers/specs/2026-03-19-library-status-redesign-design.md` → `context/spec/005-library-status-redesign/functional-spec.md`. **[Agent: general-purpose]**
  - [x] Copy `docs/superpowers/plans/2026-03-19-library-status-redesign.md` → `context/spec/005-library-status-redesign/technical-considerations.md`. **[Agent: general-purpose]**
  - [x] Search for all references to `docs/superpowers/` across the repo and update links to point to the new location. Update `product-definition.md` link if it references the old path. **[Agent: general-purpose]**
  - [x] Delete the original files from `docs/superpowers/`. **[Agent: general-purpose]**
  - [x] Verify: All links in `context/product/product-definition.md` resolve correctly; no references to `docs/superpowers/` remain. **[Agent: general-purpose]**

## Phase 3: P2 — Refactoring

- [x] **Slice 8: Split igdb-service.unit.test.ts**
  - [x] N/A: Shared test setup not needed — vi.mock must be top-level per file, setup is only 2 lines. **[Agent: typescript-test-expert]**
  - [x] Create `igdb-search.unit.test.ts` (25 tests, 640 lines). **[Agent: typescript-test-expert]**
  - [x] Create `igdb-game-detail.unit.test.ts` (44 tests, 965 lines). **[Agent: typescript-test-expert]**
  - [x] Create `igdb-discovery.unit.test.ts` (36 tests, 915 lines). **[Agent: typescript-test-expert]**
  - [x] Create `igdb-events.unit.test.ts` (20 tests, 527 lines). **[Agent: typescript-test-expert]**
  - [x] Create `igdb-edge-cases.unit.test.ts` (6 tests, 312 lines). **[Agent: typescript-test-expert]**
  - [x] Delete original `igdb-service.unit.test.ts`. **[Agent: typescript-test-expert]**
  - [x] Verify: 131 tests pass across 5 files — exact match with original baseline. **[Agent: typescript-test-expert]**

- [x] **Slice 9: Fix DAL→features reverse imports (Pattern A)**
  - [x] Move `SearchGamesSchema` to `data-access-layer/handlers/game-search/schemas.ts`. Feature re-exports from DAL. **[Agent: nextjs-expert]**
  - [x] Move `connectSteamSchema` to `data-access-layer/handlers/steam-import/schemas.ts`. Feature re-exports from DAL. **[Agent: nextjs-expert]**
  - [x] Move `getPlatformsForLibraryModal` to `data-access-layer/handlers/platform/`. Feature re-exports from DAL. **[Agent: nextjs-expert]**
  - [x] Verify: Zero DAL→features imports in source files. Typecheck errors are pre-existing (library-status-redesign branch). **[Agent: nextjs-expert]**

- [x] **Slice 10: Fix @prisma/client leakage in features (Pattern B)**
  - [x] Create `data-access-layer/domain/imported-game/` with `ImportedGameDto`, `Storefront`, `IgdbMatchStatus` types. **[Agent: nextjs-expert]**
  - [x] Update all 11 steam-import TS files to use domain types instead of `@prisma/client`. **[Agent: nextjs-expert]**
  - [x] Verify: Zero `@prisma/client` imports in `features/steam-import/*.{ts,tsx}`. Typecheck errors are pre-existing only. **[Agent: nextjs-expert]**

- [x] **Slice 11: Configure Dependabot**
  - [x] Create `.github/dependabot.yml` with weekly configs for: savepoint-app (npm), lambdas-py (pip), infra (terraform). **[Agent: general-purpose]**
  - [ ] Verify: Merge to main and confirm Dependabot creates PRs within 1 week. **[Agent: general-purpose]**

## Post-Completion

- [ ] Run the same audit checklist to verify overall score is 80%+ (Grade B) with no critical findings remaining.
