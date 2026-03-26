# Tasks: Code Health & Developer Experience (Round 2)

- **Spec:** [functional-spec.md](functional-spec.md) | [technical-considerations.md](technical-considerations.md)
- **Status:** Ready

---

- [x] **Slice 1: Root CLAUDE.md + Documentation Foundation (REQ-01, 02, 03, 05)**
  - [x] Create root `CLAUDE.md` with project overview: what SavePoint is, target audience **[Agent: general-purpose]**
  - [x] Add architecture section: monorepo structure (savepoint-app, lambdas-py, infra), communication (SQS, S3 CSV, shared PostgreSQL) **[Agent: general-purpose]**
  - [x] Add Quick Start section: `docker compose up -d`, `pnpm install`, dev server, env setup via `.env.example`, db migrations **[Agent: general-purpose]**
  - [x] Add Commands by Layer table: dev/test/lint/build for savepoint-app, lambdas-py, infra **[Agent: general-purpose]**
  - [x] Add Git Workflow section: branch naming (`feat/`, `fix/`, `chore/`), conventional commits, cross-layer branches in single branch (REQ-05) **[Agent: general-purpose]**
  - [x] Add Spec-First Workflow section: new features require spec in `context/spec/`, workflow `/awos:spec` → `/awos:tech` → `/awos:tasks` → `/awos:implement`, feature branches reference spec dir in first commit (REQ-03) **[Agent: general-purpose]**
  - [x] Add CI Overview section: pr-checks.yml (lint, format, typecheck, tests, migration validation), deploy.yml, e2e.yml **[Agent: general-purpose]**
  - [x] Verify file is under 200 lines and does not duplicate service-level CLAUDE.md content **[Agent: general-purpose]**

- [x] **Slice 2: CLAUDE.md Cleanup (REQ-07)**
  - [x] Remove directory tree listing from `savepoint-app/app/CLAUDE.md` (keep non-obvious auth/middleware behavior notes) **[Agent: general-purpose]**
  - [x] Remove directory tree listing from `savepoint-app/data-access-layer/CLAUDE.md` (keep data flow rules and cross-layer import constraints) **[Agent: general-purpose]**
  - [x] Remove template/boilerplate code examples from `savepoint-app/data-access-layer/handlers/CLAUDE.md` (keep non-obvious patterns) **[Agent: general-purpose]**
  - [x] Remove template/boilerplate code examples from `savepoint-app/data-access-layer/services/CLAUDE.md` (keep non-obvious patterns) **[Agent: general-purpose]**
  - [x] Consolidate duplicated import rules: keep in parent `data-access-layer/CLAUDE.md`, remove redundant copies from children **[Agent: general-purpose]**
  - [x] Verify all CLAUDE.md files are under 200 lines via `wc -l` **[Agent: general-purpose]**

- [x] **Slice 3: .gitignore + Stale Docs Fix (REQ-08, 09)**
  - [x] Append `*.p12`, `*.pfx`, `credentials*`, `secrets*` to root `.gitignore` under a `# Certificates & secrets` section **[Agent: general-purpose]**
  - [x] Remove or fix dead `./documentation/` link in `savepoint-app/README.md` (around line 492) **[Agent: general-purpose]**
  - [x] Create `scripts/README.md` documenting `init-localstack.sh` and `localstack-cors.json` **[Agent: general-purpose]**
  - [x] Verify: grep .gitignore for new patterns, confirm dead link removed, confirm scripts/README.md exists **[Agent: general-purpose]**

- [ ] **Slice 4: Repository Bypass Fixes (REQ-06)**
  - [ ] Extend `GameService` with `getGameByIgdbId(igdbId: number)` method wrapping `findGameByIgdbId` from game repository **[Agent: nextjs-fullstack]**
  - [ ] Extend `GameService` with `getGamesByIds(gameIds: string[])` method wrapping `findGamesByIds` from game repository **[Agent: nextjs-fullstack]**
  - [ ] Update `features/steam-import/use-cases/import-game-to-library.ts` to import from service instead of repository **[Agent: nextjs-fullstack]**
  - [ ] Update `features/journal/server-actions/get-games-by-ids.ts` to import from service instead of repository **[Agent: nextjs-fullstack]**
  - [ ] Update `app/(protected)/journal/page.tsx` to import from service instead of repository **[Agent: nextjs-fullstack]**
  - [ ] Verify: `grep -r "@/data-access-layer/repository" savepoint-app/features/ savepoint-app/app/` returns zero matches **[Agent: nextjs-fullstack]**
  - [ ] Verify: `pnpm --filter savepoint typecheck` passes and existing tests pass **[Agent: nextjs-fullstack]**

- [x] **Slice 5: Root Makefile (REQ-10, part 1)**
  - [x] Create root `Makefile` with `.PHONY` targets: `dev`, `test`, `lint`, `format`, `typecheck` **[Agent: general-purpose]**
  - [x] `dev` target: `docker compose up -d && pnpm --filter savepoint dev` **[Agent: general-purpose]**
  - [x] `test` target: `pnpm --filter savepoint test && cd lambdas-py && uv run pytest` **[Agent: general-purpose]**
  - [x] `lint` target: `pnpm --filter savepoint lint && cd lambdas-py && uv run ruff check .` **[Agent: general-purpose]**
  - [x] `format` target: `pnpm --filter savepoint format:check && cd lambdas-py && uv run ruff format --check .` **[Agent: general-purpose]**
  - [x] `typecheck` target: `pnpm --filter savepoint typecheck && cd lambdas-py && uv run mypy .` **[Agent: general-purpose]**
  - [x] Verify: run `make lint` locally to confirm commands execute **[Agent: general-purpose]**

- [x] **Slice 6: CI Workflow Expansion (REQ-10, part 2)**
  - [x] Add `lambdas-py-checks` job to `.github/workflows/pr-checks.yml` **[Agent: general-purpose]**
  - [x] Job steps: setup Python 3.12 (`actions/setup-python@v5`), install uv, `uv sync`, `uv run ruff check .`, `uv run ruff format --check .`, `uv run mypy .`, `uv run pytest` **[Agent: general-purpose]**
  - [x] Add `paths` filter on `lambdas-py/**` so job skips when no Python files changed **[Agent: general-purpose]**
  - [x] Verify: push to test branch, confirm new CI job appears **[Agent: general-purpose]**

- [ ] **Slice 7: Generate tasks.md for Spec 005 (REQ-04)**
  - [ ] Execute `/awos:tasks 005` to generate `context/spec/005-library-status-redesign/tasks.md` **[Agent: general-purpose]**
  - [ ] Verify file contains vertical slices with `**[Agent: agent-name]**` format sub-tasks **[Agent: general-purpose]**

- [ ] **Slice 8: Final Validation**
  - [ ] Re-run `/awos:audit` and verify overall score >= 85% **[Agent: general-purpose]**
  - [ ] Verify AI Development Tooling dimension >= 75% (Grade B) **[Agent: general-purpose]**
  - [ ] Verify End-to-End Delivery dimension >= 60% (Grade C) **[Agent: general-purpose]**
  - [ ] Fix any remaining P0 findings **[Agent: general-purpose]**
