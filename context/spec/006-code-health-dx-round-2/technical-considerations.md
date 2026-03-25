# Technical Specification: Code Health & Developer Experience (Round 2)

- **Functional Specification:** [context/spec/006-code-health-dx-round-2/functional-spec.md](functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail

---

## 1. High-Level Technical Approach

This is an internal engineering quality initiative — no user-facing changes, no data model changes, no API changes. The work divides into three categories:

1. **Documentation & configuration** (REQ-01–03, 05, 07–09): New and edited markdown files, .gitignore additions, CLAUDE.md cleanup
2. **Refactoring** (REQ-06): Extend existing services to expose 2 methods, update 3 import sites
3. **Tooling** (REQ-04, 10): Root Makefile creation, CI workflow expansion for lambdas-py

Systems affected: CLAUDE.md ecosystem, .gitignore, 3 TypeScript source files in savepoint-app, 1 GitHub Actions workflow, root Makefile (new), scripts/README.md (new).

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Root CLAUDE.md (REQ-01, REQ-02, REQ-03, REQ-05)

Create `CLAUDE.md` at the repository root. Four functional requirements (REQ-01, 02, 03, 05) converge into this single file. Target: under 200 lines.

**Sections:**

| Section | Content | Source REQ |
|---------|---------|------------|
| Project Overview | What SavePoint is, target audience (1-2 sentences) | REQ-01 |
| Architecture | Monorepo structure: savepoint-app (Next.js 15), lambdas-py (Python 3.12), infra (Terraform). Communication: SQS, S3 CSV, shared PostgreSQL | REQ-01 |
| Quick Start | `docker compose up -d`, `pnpm install`, `pnpm --filter savepoint dev` (port 6060), env var setup via `.env.example`, `pnpm --filter savepoint db:migrate` | REQ-02 |
| Commands by Layer | Table: layer → dev/test/lint/build commands for savepoint-app, lambdas-py, infra | REQ-01, REQ-02 |
| Lambda Testing | `cd lambdas-py && uv run pytest` for unit/integration tests | REQ-02 |
| Git Workflow | Branch naming (`feat/`, `fix/`, `chore/`), conventional commits, cross-layer branches in single branch | REQ-05 |
| Spec-First Workflow | New features require spec in `context/spec/` before implementation. Workflow: `/awos:spec` → `/awos:tech` → `/awos:tasks` → `/awos:implement`. Feature branches reference spec dir in first commit | REQ-03 |
| CI Overview | pr-checks.yml (lint, format, typecheck, tests, migration validation), deploy.yml, e2e.yml | REQ-01 |

**Constraints:**
- Must not duplicate content in service-level CLAUDE.md files (reference them instead)
- No directory tree listings — agents can discover structure via Glob
- No code examples or templates

### 2.2 CLAUDE.md Cleanup (REQ-07)

Edit existing files to remove discoverable content:

| File | Action |
|------|--------|
| `savepoint-app/app/CLAUDE.md` | Remove directory structure listing around lines 15-33 (route group descriptions). Keep the non-obvious auth/middleware behavior notes |
| `savepoint-app/data-access-layer/CLAUDE.md` | Remove directory tree listing around lines 39-71. Keep data flow rules and cross-layer import constraints |
| `savepoint-app/data-access-layer/handlers/CLAUDE.md` | Remove any template/boilerplate code examples. Keep non-obvious patterns (Result type usage, error mapping) |
| `savepoint-app/data-access-layer/services/CLAUDE.md` | Remove any template/boilerplate code examples. Keep non-obvious patterns (ServiceResult, when to use use-cases) |
| DAL sub-layer files | Consolidate duplicated import rules — keep rules in parent `data-access-layer/CLAUDE.md`, remove from children where redundant |

**Validation:** After cleanup, verify every file is under 200 lines using `wc -l`.

### 2.3 Repository Bypass Fixes (REQ-06)

Extend existing services to expose the needed methods, then update the 3 import sites.

**Step 1 — Service layer extensions:**

| Service | New Method | Wraps |
|---------|-----------|-------|
| `GameService` (or relevant game service) | `getGameByIgdbId(igdbId: number)` | `findGameByIgdbId` from game repository |
| `GameService` (or relevant game service) | `getGamesByIds(gameIds: string[])` | `findGamesByIds` from game repository |

Both methods return `ServiceResult<T>` following existing patterns. No new business logic — these are thin wrappers that maintain the architectural boundary.

**Step 2 — Update import sites:**

| File | Current Import | New Import |
|------|---------------|------------|
| `features/steam-import/use-cases/import-game-to-library.ts` | `findGameByIgdbId` from `@/data-access-layer/repository` | `getGameByIgdbId` from the extended game service |
| `features/journal/server-actions/get-games-by-ids.ts` | `findGamesByIds` from `@/data-access-layer/repository` | `getGamesByIds` from the extended game service |
| `app/(protected)/journal/page.tsx` | `findGamesByIds` from `@/data-access-layer/repository` | `getGamesByIds` from the extended game service |

**Step 3 — Verify no remaining violations:**

Run `grep -r "@/data-access-layer/repository" savepoint-app/features/ savepoint-app/app/` to confirm zero direct repository imports from outside the DAL.

### 2.4 .gitignore Expansion (REQ-08)

Append to the root `.gitignore` under a new `# Certificates & secrets` section:

```
*.p12
*.pfx
credentials*
secrets*
```

### 2.5 Stale Documentation Fixes (REQ-09)

**Dead link fix:** Remove or replace the `[Documentation](./documentation/)` link at line 492 of `savepoint-app/README.md`.

**New file:** Create `scripts/README.md` documenting:
- `init-localstack.sh` — Waits for LocalStack readiness, creates S3 bucket with CORS config
- `localstack-cors.json` — CORS configuration for local S3 development

### 2.6 Root Makefile (REQ-10)

Create `Makefile` at the repository root. Targets:

| Target | Command(s) | Description |
|--------|-----------|-------------|
| `dev` | `docker compose up -d && pnpm --filter savepoint dev` | Start infrastructure + Next.js dev server |
| `test` | `pnpm --filter savepoint test && cd lambdas-py && uv run pytest` | Run all test suites |
| `lint` | `pnpm --filter savepoint lint && cd lambdas-py && uv run ruff check .` | Lint all layers |
| `format` | `pnpm --filter savepoint format:check && cd lambdas-py && uv run ruff format --check .` | Check formatting |
| `typecheck` | `pnpm --filter savepoint typecheck && cd lambdas-py && uv run mypy .` | Type-check all layers |

Use `.PHONY` for all targets. Each target runs sequentially across layers.

### 2.7 CI Workflow Expansion (REQ-10)

Extend `.github/workflows/pr-checks.yml` to add a lambdas-py validation job:

**New job: `lambdas-py-checks`**

| Step | Command |
|------|---------|
| Setup Python 3.12 | `actions/setup-python@v5` |
| Install uv | Standard uv install action |
| Install dependencies | `cd lambdas-py && uv sync` |
| Ruff lint | `uv run ruff check .` |
| Ruff format check | `uv run ruff format --check .` |
| Mypy type check | `uv run mypy .` |
| Pytest | `uv run pytest` |

This job runs in parallel with existing savepoint-app checks. Uses `paths` filter on `lambdas-py/**` to skip when no Python files changed.

### 2.8 Generate tasks.md for Spec 005 (REQ-04)

Run `/awos:tasks` targeting `context/spec/005-library-status-redesign/`. This is a workflow step, not a code change — the command generates the file from the existing functional-spec.md and technical-considerations.md.

---

## 3. Impact and Risk Analysis

**System Dependencies:**
- REQ-06 (repository bypass fixes) touches 3 source files and extends a service. Existing tests must pass after refactoring.
- REQ-10 (CI expansion) adds a new job to pr-checks.yml. If lambdas-py tests are currently failing, this will block PRs. Must verify `cd lambdas-py && uv run pytest` passes before merging.

**Potential Risks & Mitigations:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| Service extension changes return types | Callers may need to unwrap ServiceResult instead of raw data | Keep return types simple; consider whether thin wrappers should return raw data or ServiceResult |
| lambdas-py tests fail in CI | PR pipeline blocks | Run `uv run pytest` locally first; consider adding the CI job in a non-blocking (continue-on-error) mode initially |
| Root CLAUDE.md grows beyond 200 lines over time | Reduced Claude adherence | Add a comment at the top noting the 200-line limit |
| Makefile commands assume tools installed | `uv`, `pnpm` must be available | Document prerequisites in root CLAUDE.md |

---

## 4. Testing Strategy

| REQ | Testing Approach |
|-----|-----------------|
| REQ-01–03, 05 | Manual verification: re-run `/awos:audit` AI Development Tooling checks |
| REQ-06 | Run existing test suites (`pnpm --filter savepoint test:backend`, `test:components`). Add grep verification: zero `@/data-access-layer/repository` imports from outside DAL |
| REQ-07 | Manual: verify all CLAUDE.md files under 200 lines via `wc -l` |
| REQ-08 | Manual: verify patterns in .gitignore |
| REQ-09 | Manual: verify dead link removed, scripts/README.md exists |
| REQ-10 | Run `make test` and `make lint` locally. Verify new CI job passes on a test PR |
| Overall | Re-run `/awos:audit` — target 85%+ overall, AI Tooling >= 75%, E2E Delivery >= 60% |
