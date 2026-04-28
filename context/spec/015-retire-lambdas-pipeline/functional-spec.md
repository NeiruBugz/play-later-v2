# Functional Specification: Retire Lambdas Pipeline

- **Roadmap Item:** Drop `lambdas-py` source + dedicated AWS infrastructure; keep Steam-account UI dormant. Resolves ARCH-06 by deletion. Updates Phase 3 with a "Blocked — pipeline removed" indicator.
- **Status:** Completed
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale

The Steam library import pipeline (`lambdas-py` + supporting AWS infrastructure) was built to enrich and import Steam games into a user's library. It is not currently deployed and is not on the near-term plan to deploy. Carrying its source, infrastructure, and runtime requirements adds:

- A second language toolchain (Python 3.12, `uv`, Docker) that contributors must install for full repo work.
- A second cloud surface (SQS, ECR, Lambda, Secrets Manager, S3 import buckets) tracked in Terraform.
- Repeated agent/Claude context cost: dedicated CLAUDE files, oversized modules flagged in audits (ARCH-06), and divergent conventions.
- Specs and roadmap items implicitly anchored to a pipeline that may not return for some time (Phase 3: Steam Stages 2–4, PSN, Xbox).

Removing the pipeline source and its dedicated infrastructure now — while leaving the user-visible Steam-account UI in place — gives a smaller surface area, a single-language workflow, and a clearer roadmap signal. If external library import is revived, it will be rebuilt against whatever conventions and stack we have at that point.

**Success measure:** `lambdas-py/` and its dedicated Terraform modules are deleted; no SQS/AWS-SDK-SQS dependency remains in the app; CI (lint, typecheck, all test suites) is green; the user-visible Steam settings, profile display, sync button, and `/steam/games` route remain reachable without breaking.

---

## 2. Functional Requirements

### User-facing

- **R1. Steam connect/disconnect remains functional.**
  - **Acceptance:**
    - [x] On Settings → Connections, a signed-in user can link their Steam account and see it marked as connected.
    - [x] On Settings → Connections, a signed-in user with a connected Steam account can disconnect and see it marked as not connected.

- **R2. The user's connected Steam profile (username, avatar, SteamID) continues to display where it does today.**
  - **Acceptance:**
    - [x] After connecting Steam, the user sees the same Steam profile information on the same screens as before this change.

- **R3. The "Sync my Steam library" trigger remains visible and clickable.**
  - **Acceptance:**
    - [x] The sync button is still present and clickable for a user with a connected Steam account, on the same screen as today.
    - [x] When clicked, the existing user-facing "background sync is currently disabled" / "please try again later" message is shown. No crash, no broken state, no white screen.

- **R4. The `/steam/games` page remains reachable.**
  - **Acceptance:**
    - [x] Navigating to `/steam/games` while signed in does not 404 or error.
    - [x] Whatever empty / imported-games state the page renders today (with no pipeline running) continues to render.

- **R5. No new user-facing copy is introduced about the pipeline being gone.**
  - **Acceptance:**
    - [x] No new "coming soon" banner, toast, or tooltip is added to the sync button or Steam settings page.

### Observable contributor / project outcomes

- **R6. Contributors no longer need Python or Docker for app or infra work.**
  - **Acceptance:**
    - [x] A fresh `git clone` + `pnpm install` + `pnpm --filter savepoint dev` works without any Python, `uv`, Docker image build, or LocalStack step. _(narrowed per tech-spec: `docker compose up -d` for postgres + LocalStack avatars still required; no Python/`uv`/Lambda-image build required.)_
    - [x] Root `CLAUDE.md` and the project Quick Start no longer reference `lambdas-py` setup or `uv`.

- **R7. CI is green.**
  - **Acceptance:**
    - [x] `pnpm --filter savepoint ci:check` passes in the PR.
    - [x] All Steam-import-related tests in `savepoint-app/` either pass or are removed alongside the code they covered (no skipped or broken tests left behind).

- **R8. The roadmap reflects the new state.**
  - **Acceptance:**
    - [x] Phase 3 of `context/product/roadmap.md` is marked **Blocked — pipeline removed; rebuild required when revisited**, with all items still listed.
    - [x] Specs 002 and 003 remain in the repo as historical record.
    - [x] Phase 5 item ARCH-06 is removed from the roadmap (resolved by deletion).

---

> **Verification note (2026-04-28):** R1, R2, R3 (button visible/clickable), R4 verified at code level — the relevant routes (`app/(protected)/settings/connections/page.tsx`, `app/(protected)/steam/games/page.tsx`, the Steam profile components) and their handlers were intentionally untouched, and `pnpm --filter savepoint build` succeeds, confirming the routes compile. R3's disabled-error response is asserted by `features/steam-import/server-actions/__tests__/trigger-background-sync.server-action.test.ts`. Visual UI smoke (sign in, click sync button, observe toast, navigate `/steam/games`) is recommended for the human reviewer pre-merge but was not executed by the implementation agents.

---

## 3. Scope and Boundaries

### In-Scope

- Delete the `lambdas-py/` directory entirely.
- Delete the Terraform modules that exist solely to support the pipeline: `infra/modules/lambda-container`, `infra/modules/lambda-imports-bucket`, `infra/modules/steam-import`, `infra/modules/ecr`, `infra/modules/secrets`, plus the `module "..."` blocks in `infra/envs/dev/` and `infra/envs/prod/` that wire them up.
- Remove the SQS enqueue code path from the app: drop the `@aws-sdk/client-sqs` dependency, replace `triggerBackgroundSync`'s body with a stub that returns the existing "currently disabled" user-facing error (so R3 still holds).
- Remove environment variables that exist only for the pipeline (`STEAM_SYNC_QUEUE_URL`, AWS access keys used only by SQS, etc.) from `savepoint-app/env.mjs` and `.env.example`.
- Update root `CLAUDE.md`, `README.md`, and quick-start docs to drop references to `lambdas-py`, `uv`, Python, and LocalStack steps that exist only for the pipeline.
- Mark Phase 3 in `context/product/roadmap.md` with a "Blocked — pipeline removed" indicator while keeping the items listed.
- Remove Phase 5 item ARCH-06 from the roadmap.
- Do all of the above on a single dedicated branch.

### Out-of-Scope

- Other Phase 5 items (SDD-03 Architecture Doc Refresh, SDD-06 Spec Status Reconciliation, E2E-01 Cross-Layer Vertical Slices, E2E-05 Terraform CI Parity, ARCH-02 FSD Type Boundaries).
- Cognito, app-assets S3, or any infra module not pipeline-specific.
- Changes to the Steam connect/disconnect flow itself.
- Building a replacement import path (HTTP, edge function, etc.) — separate future spec.
- Removing the `ImportedGame` model from the database schema — it stays.
- Deleting historical specs 002 or 003.
- All other roadmap items in Phases 2–4.
