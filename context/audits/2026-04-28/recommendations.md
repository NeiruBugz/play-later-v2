# Audit Recommendations — 2026-04-28

## P0 — Fix Immediately

_None — no critical-severity FAILs._

## P1 — Fix Soon

### 1. Back-propagate Next.js 16 + Redis to architecture.md

- **Dimension:** Spec-Driven Development
- **Check:** SDD-03
- **Effort:** Low
- **Details:** Edit `context/architecture.md`:
  - Replace "Next.js 15" with "Next.js 16" (codebase is on `next@16.2.3` per `savepoint-app/package.json`).
  - Move Upstash Redis out of "Future considerations" — `@upstash/redis` and `@upstash/ratelimit` are active runtime dependencies (rate-limiting).
  - Cross-reference spec 010 (Next.js 16 migration) so future drift is traceable.

### 2. Reconcile spec status hygiene

- **Dimension:** Spec-Driven Development
- **Check:** SDD-06
- **Effort:** Low
- **Details:**
  - `context/spec/002-*/`: status currently `Draft`, but tasks.md shows 55/55 `[x]`. Update status to `Completed`.
  - Re-check specs 009 and 012 (`In Review`) against actual delivery state — if shipped, mark `Completed`; if still in flight, leave but ensure tasks.md reflects reality.
  - Run `/awos:verify` on any spec where status disagrees with task completion.

### 3. Resume cross-layer vertical slices

- **Dimension:** End-to-End Delivery
- **Check:** E2E-01
- **Effort:** Medium
- **Details:** Recent feature branches concentrate on `savepoint-app/` UI/UX (9/10 branches). Backend pipeline is stable but `lambdas-py/` and `infra/` have not moved with feature work. For upcoming roadmap items requiring data-pipeline or infra changes, keep the change in a single branch rather than splitting into per-layer PRs. Spec 011 already demonstrates this pattern works — repeat it.

## P2 — Improve When Possible

### 4. Add Terraform CI checks

- **Dimension:** End-to-End Delivery
- **Check:** E2E-05
- **Effort:** Low
- **Details:** Add a job to `.github/workflows/pr-checks.yml` (conditional on `infra/**` paths) running `terraform fmt -check -recursive` and `terraform validate` from `infra/envs/dev/`. Brings infra to parity with the app and lambda CI gates.

### 5. Decompose oversized lambdas-py modules

- **Dimension:** Code Architecture
- **Check:** ARCH-06
- **Effort:** Medium
- **Details:** Three files exceed the 500-LOC soft threshold:
  - `lambdas-py/src/services/database.py` (769 LOC)
  - `lambdas-py/src/handlers/database_import.py` (696 LOC)
  - `lambdas-py/src/models/db.py` (526 LOC)

  Split by responsibility (e.g., separate read vs. write services in `database.py`; separate model groups in `db.py`). Currently passes the threshold check but is the largest concentrated tech debt.

### 6. Clean type-only boundary leak in social feature

- **Dimension:** Code Architecture
- **Check:** ARCH-02
- **Effort:** Low
- **Details:** `features/social/ui/followers-list.tsx` and `following-list.tsx` import types directly from the repository layer, bypassing FSD boundaries. Move shared types into `entities/social/types` (or wherever the canonical domain type lives) and import from there. Type-only so non-blocking, but tightens the FSD boundary contract.
