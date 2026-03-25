# Technical Specification: Code Health & Developer Experience

- **Functional Specification:** [functional-spec.md](functional-spec.md)
- **Status:** Completed
- **Author(s):** Nail

---

## 1. High-Level Technical Approach

This spec covers 10 configuration, documentation, and refactoring tasks — no new services, APIs, or database changes. Work is organized in three phases:

- **Phase 1 (P0):** Three config file edits — `.mcp.json`, `.claude/settings.json`, `.gitignore`
- **Phase 2 (P1):** Documentation cleanup — trim 5 CLAUDE.md files, create 2 new ones, fix 2 READMEs, relocate 1 spec directory
- **Phase 3 (P2):** Code refactoring — split 1 test file, fix 15 import boundary violations across 2 patterns, add Dependabot config

No system architecture changes. All refactoring preserves existing behavior and must pass the full test suite.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### Phase 1: P0 — Config Changes

#### 2.1 Add Playwright MCP to .mcp.json (AI-07)

**File:** `.mcp.json`

Add the `plugin:playwright:playwright` MCP server entry alongside the existing `awos-recruitment` entry. This enables AI agents to launch a browser, navigate to `localhost:6060`, and visually verify UI changes.

**Verification:** Agent can call `mcp__plugin_playwright_playwright__browser_navigate` and `mcp__plugin_playwright_playwright__browser_take_screenshot` against the running Next.js dev server.

#### 2.2 Add PreToolUse security hooks (SEC-02)

**File:** `.claude/settings.json`

Add a `hooks.PreToolUse` array with a shell script that checks tool arguments against sensitive file patterns. The hook must:
- Intercept `Read`, `Glob`, `Edit`, `Write`, and `Bash` tool calls
- Block access to: `.env`, `.env.local`, `.env.production`, `*.pem`, `*.key`, `credentials*`, `secrets*`, `*.p12`, `*.pfx`
- Allow `.env.example` and `.env.test` (non-sensitive)

**New file:** `.claude/hooks/check-sensitive-files.sh` — shell script implementing the pattern check. Returns non-zero exit code to block, zero to allow.

**Verification:** Attempt to `Read` a `.env` file in a Claude Code session — the hook should deny it.

#### 2.3 Add *.key to root .gitignore (SEC-05)

**File:** `.gitignore`

Add `*.key` pattern in the security-sensitive section (near existing `.env` patterns).

**Verification:** `git check-ignore test.key` returns a match.

### Phase 2: P1 — Documentation

#### 2.4 Trim CLAUDE.md files to <200 lines (AI-06)

**5 files exceeding the limit:**

| File | Current | Target |
|------|---------|--------|
| `savepoint-app/test/CLAUDE.md` | 292 | <200 |
| `savepoint-app/features/CLAUDE.md` | 345 | <200 |
| `savepoint-app/shared/CLAUDE.md` | 273 | <200 |
| `savepoint-app/data-access-layer/repository/CLAUDE.md` | 333 | <200 |
| `savepoint-app/data-access-layer/domain/CLAUDE.md` | 261 | <200 |

**Removal targets (apply to each file):**
- Directory tree listings (derivable via `ls`/`tree`)
- Code template examples (derivable from existing code)
- Tutorial-style prose (Claude can read the code)
- Content duplicated across multiple CLAUDE.md files
- Architecture diagrams already in `context/product/architecture.md`

**Retention test:** "Would removing this line cause Claude to make mistakes?" Keep only: commands, conventions, gotchas, non-obvious patterns.

#### 2.5 Add CLAUDE.md for lambdas-py/ and infra/ (AI-01)

**New files:**
- `lambdas-py/CLAUDE.md` — Purpose, Python version, key commands (build, test, deploy via SAM), Lambda function inventory, non-obvious conventions
- `infra/CLAUDE.md` — Purpose, Terraform version, key commands (init, plan, apply), module inventory, environment structure, state backend details

Each file must be under 200 lines.

#### 2.6 Fix stale README claims (DOC-04)

**Files and changes:**

| File | Fix |
|------|-----|
| `README.md` (root) | Update to list all 3 service dirs: savepoint-app, lambdas-py, infra |
| `savepoint-app/README.md` | Replace references to "Bun" with "pnpm" |
| `savepoint-app/README.md` | Update feature directory listing to match actual `features/` contents |

#### 2.7 Move library-status-redesign spec to context/spec/ (SDD-04)

**Current location:** `docs/superpowers/`
- `docs/superpowers/specs/2026-03-19-library-status-redesign-design.md`
- `docs/superpowers/plans/2026-03-19-library-status-redesign.md`

**Target location:** `context/spec/NNN-library-status-redesign/`
- Map the design spec → `functional-spec.md`
- Map the plan → `technical-considerations.md`
- Create a `tasks.md` stub if one doesn't exist

**Post-move:** Update any internal links (product-definition.md references `../spec/002-status-simplification/functional-spec.md` — verify this still resolves correctly). Delete originals from `docs/superpowers/`.

### Phase 3: P2 — Refactoring

#### 2.8 Split igdb-service.unit.test.ts (ARCH-06)

**Current:** 1 file, 3260 lines, 18 top-level describe blocks.

**Proposed split by functional concern:**

| New file | Describe blocks |
|----------|----------------|
| `igdb-search.unit.test.ts` | searchGamesByName, getGameBySteamAppId, getTopRatedGames, searchPlatformByName |
| `igdb-game-detail.unit.test.ts` | getGameGenres, getGameAggregatedRating, getGameCompletionTimes, getGameScreenshots, getGameArtworks |
| `igdb-discovery.unit.test.ts` | getSimilarGames, getGameExpansions, getFranchiseGames, getCollectionGamesById |
| `igdb-events.unit.test.ts` | getUpcomingReleasesByIds, getUpcomingGamingEvents, getEventLogo |
| `igdb-edge-cases.unit.test.ts` | Sparse Data Handling |

Shared test setup (mocks, fixtures) extracted to a local `__test-utils__.ts` file if duplicated across splits.

#### 2.9 Fix architectural boundary violations (ARCH-02/04)

**Pattern A — DAL→features reverse imports (4 files):**

| File | Current import | Fix |
|------|---------------|-----|
| `handlers/game-search/game-search-handler.ts` | `@/features/game-search/schemas` | Move `SearchGamesSchema` to `handlers/game-search/schemas.ts` |
| `handlers/platform/get-platforms-handler.ts` | `@/features/manage-library-entry/use-cases` | Move `getPlatformsForLibraryModal` to `handlers/platform/` or DAL use-cases |
| `handlers/platform/get-platforms-handler.unit.test.ts` | Same as above | Follows handler fix |
| `handlers/steam-import/steam-connect.handler.ts` | `@/features/steam-import/schemas` | Move `connectSteamSchema` to `handlers/steam-import/schemas.ts` |

**Approach:** Co-locate validation schemas with the handlers that consume them. For the `getPlatformsForLibraryModal` use-case, move the function into the DAL handler directory or a DAL-level use-case. Update the features layer to import from the new location (features can import from DAL per the architecture).

**Pattern B — @prisma/client in features/ (11 files, all steam-import):**

| Prisma type used | Replacement |
|-----------------|-------------|
| `ImportedGame` model type | `ImportedGameDto` in `data-access-layer/domain/steam-import/` |
| `LibraryStatus` enum | Already exists in `data-access-layer/domain/library/enums.ts` |
| Other Prisma-generated types | Domain types or DTOs in `data-access-layer/domain/steam-import/` |

**New directory:** `data-access-layer/domain/steam-import/` following the existing pattern (see `domain/library/`, `domain/game/`).

**Approach:** Create domain DTOs and a mapper, then update all 11 steam-import files to import from the domain layer instead of `@prisma/client`.

#### 2.10 Configure Dependabot (SBP-07)

**New file:** `.github/dependabot.yml`

**Update configurations:**

| Directory | Ecosystem | Schedule |
|-----------|-----------|----------|
| `/savepoint-app` | npm | weekly |
| `/lambdas-py` | pip | weekly |
| `/infra` | terraform | weekly |

Keep configuration minimal — default grouping (individual PRs per dependency), weekly schedule, no custom labels or reviewers.

---

## 3. Impact and Risk Analysis

**System Dependencies:**
- Phase 1 and 2 have zero impact on application code or behavior
- Phase 3 refactoring (2.8, 2.9) touches test files and import paths — risk of breaking tests

**Potential Risks & Mitigations:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| CLAUDE.md trimming removes essential context | AI makes worse suggestions | Review each removal against "would this cause mistakes?" test; diff review before commit |
| Spec relocation breaks internal links | Broken documentation references | Search for all references to `docs/superpowers/` and `002-status-simplification` before deleting originals |
| Test file split introduces import errors | CI failures | Run full `pnpm test --project=unit` after each split; keep shared setup DRY |
| Schema relocation breaks feature imports | Compile errors | Run `pnpm typecheck` after each move; update barrel exports |
| Prisma domain type mapping misses fields | Runtime type errors | Compare Prisma types field-by-field; ensure mapper tests cover all fields |
| Security hook blocks legitimate operations | Developer friction | Whitelist `.env.example` and `.env.test` explicitly; test hook with common workflows |

---

## 4. Testing Strategy

| Item | Test approach |
|------|--------------|
| 2.1 Playwright MCP | Manual: verify agent can screenshot localhost:6060 |
| 2.2 Security hooks | Manual: attempt to read `.env` in Claude Code session |
| 2.3 .gitignore | `git check-ignore test.key` |
| 2.4 CLAUDE.md trim | `wc -l` on all files; diff review |
| 2.5 New CLAUDE.md | `wc -l`; content review |
| 2.6 README fixes | Content review; grep for "Bun" |
| 2.7 Spec relocation | Verify links resolve; no broken references |
| 2.8 Test split | `pnpm test --project=unit` — all tests pass, same count |
| 2.9 Boundary fixes | `pnpm typecheck` + `pnpm test` — full green; grep confirms no remaining violations |
| 2.10 Dependabot | Merge to main; verify Dependabot creates PRs within 1 week |

**Re-audit:** After all phases complete, run the same audit checklist to verify 80%+ score.
