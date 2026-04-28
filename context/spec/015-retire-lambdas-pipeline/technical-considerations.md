# Technical Specification: Retire Lambdas Pipeline

- **Functional Specification:** [`functional-spec.md`](./functional-spec.md)
- **Status:** Completed
- **Author(s):** Nail Badiullin

---

## 1. High-Level Technical Approach

A surgical deletion across three layers, on a single branch, in one PR:

1. **`lambdas-py/`** — delete the directory in full.
2. **`infra/`** — delete the five pipeline-only modules and their wiring; preserve `cognito` and `s3` (app-assets) modules untouched.
3. **`savepoint-app/`** — strip the SQS enqueue path; keep the Steam UI surfaces, server actions, hooks, and `ImportedGame` repository code intact. The existing feature-flag short-circuit becomes the *only* code path.
4. **Repo plumbing** — Makefile, root docs, CI workflows, dependabot, env schema, package manifest.
5. **Roadmap & docs** — flip Phase 3 to Blocked; remove ARCH-06.

No new code is written; the only logic change is reducing `triggerBackgroundSync` to its disabled-flag short-circuit. Everything else is delete + reference cleanup.

---

## 2. Proposed Solution & Implementation Plan

### 2.1 `savepoint-app/` changes

| Path | Change |
|---|---|
| `features/steam-import/server-actions/trigger-background-sync.ts` | Replace body with the existing "background sync currently disabled" `ActionResult` (the path that already runs when the flag is off). Drop `SQSClient`/`SendMessageCommand` imports, `ProfileService` call (no longer needed to gate on connection — disabled-state takes precedence), `SteamSyncMessage` interface. Keep the action signature, `actionName`, and Zod schema unchanged so the UI button continues to render and respond identically to today. |
| `features/steam-import/config.ts` | Hardcode `isBackgroundSyncEnabled: false`. Remove dependency on `env.ENABLE_STEAM_BACKGROUND_SYNC`. |
| `env.mjs` | Remove `ENABLE_STEAM_BACKGROUND_SYNC` and `STEAM_SYNC_QUEUE_URL` from `runtimeEnv` and `server` blocks. |
| `.env.example` | Remove the same two vars. |
| `package.json` | Remove `@aws-sdk/client-sqs` dependency. Run `pnpm install` to update `pnpm-lock.yaml`. |
| `features/steam-import/CLAUDE.md` | Add a short "pipeline retired — see spec 015" note at top; leave structure docs in place since the UI surfaces still exist. |

**No changes** to: `app/(protected)/steam/games/page.tsx`, `app/(protected)/settings/connections/page.tsx`, `app/api/steam/{sync,games,connect}/route.ts` (these read from `ImportedGame` and the connection table — they continue to function; the imported-games list will simply remain empty until something writes to `ImportedGame` again), feature hooks, `ImportedGame` Prisma model, `manage-library-entry` integration with imported games.

**Tests to revisit:** any test that asserts SQS send behavior in `triggerBackgroundSync` is removed/rewritten to assert the disabled-error response path. Any integration test for `/api/steam/sync` that depends on a queued message is dropped.

### 2.2 `infra/` changes

**Delete entire module directories:**
- `infra/modules/lambda-container/`
- `infra/modules/lambda-imports-bucket/`
- `infra/modules/steam-import/`
- `infra/modules/ecr/`
- `infra/modules/secrets/`

**Edit `infra/envs/dev/main.tf` and `infra/envs/prod/main.tf`** — remove these `module` blocks: `ecr`, `lambda_secrets`, `lambda_imports_bucket`, `steam_import_queue`, `steam_import_lambda`, `igdb_enrichment_lambda`, `database_import_lambda`. Preserve `cognito` and `s3` blocks verbatim. Remove any pipeline-related `output` blocks if present (none currently — only `cognito_*` and `s3_bucket_name` are exported).

**Edit `infra/envs/{dev,prod}/variables.tf`** — drop pipeline-only vars: `lambda_log_level`, `enable_steam_import_event_source`, `steam_import_sender_principals`. Keep `project_name`, `environment`, `region`, `app_url`, Cognito vars, S3 vars.

**Edit `infra/envs/{dev,prod}/terraform.tfvars.example`** — strip the same pipeline vars.

**Edit `infra/CLAUDE.md`** — drop pipeline modules from the inventory table; remove pipeline-specific gotchas (`sender_principals = ["*"]`, Lambda images / ECR push order, `enable_steam_import_event_source`, `steam_import_lambda` concurrency, `database_import_lambda` VPC TODO). Keep Cognito + S3 sections.

**Terraform state caveat:** state is local per env (no remote backend), so module removal does not require `terraform state rm` choreography for shared state. Local state files are gitignored. If anyone has previously applied dev infra, a manual `terraform destroy` against the removed modules is their responsibility before this branch lands — flagged in the PR description.

### 2.3 Repo-wide plumbing

| Path | Change |
|---|---|
| `Makefile` | Strip `&& cd lambdas-py && uv run …` from `test`, `lint`, `format`, `typecheck` targets. |
| `CLAUDE.md` (root) | Drop `lambdas-py/` row from the architecture table; drop the row referencing `lambdas-py/CLAUDE.md`; drop the "Trigger Steam import locally" row from the look-up table; drop the `lambdas-py` section from "Commands by Layer"; remove `infra` references to deleted modules. |
| `README.md` (root) | Same surgical removals — keep app + infra (Cognito/S3) onboarding intact. |
| `.github/workflows/{pr-checks,e2e,integration,deploy}.yml` | Audit for any `lambdas-py`, `uv`, `python-version`, `setup-python` steps. Remove. (No Terraform CI exists — explicitly out-of-scope, deferred to Phase 5 E2E-05.) |
| `.github/dependabot.yml` | Remove any `pip` / `lambdas-py` ecosystem entries. Keep npm + Terraform if present. |
| `docker-compose.yml` | No change — postgres + pgadmin + localstack remain (needed for app + S3 avatars). |
| `.env.example` (root if exists) and `savepoint-app/.env.example` | Strip `STEAM_SYNC_QUEUE_URL`, `ENABLE_STEAM_BACKGROUND_SYNC`. |

### 2.4 Roadmap & spec docs

| Path | Change |
|---|---|
| `context/product/roadmap.md` | Phase 3 header gets a bold note: **`> Blocked — Lambda pipeline removed in spec 015. Items below require the pipeline to be rebuilt before they can ship.`** Items themselves stay listed and unchecked. Phase 5 item ARCH-06 is removed. |
| `context/product/architecture.md` | No edits in this spec — left to Phase 5 SDD-03. (Two scattered Lambda mentions exist at L580 / L676; touching them here would scope-creep.) |
| `context/spec/002-steam-import-foundation/` | No change. Historical record. |
| `context/spec/003-steam-import-curation/` | No change. Historical record. |
| `context/spec/015-retire-lambdas-pipeline/` | This spec. After implementation, gets a `tasks.md` (via `/awos:tasks`). |

---

## 3. Impact and Risk Analysis

### System Dependencies

- **Database schema is unaffected.** `ImportedGame` table + relations stay in `schema.prisma`. No migration needed. The `import-game-to-library` use-case continues to work for any rows that already exist.
- **Avatar pipeline is unaffected.** Independent of Lambdas; uses `@aws-sdk/client-s3` + LocalStack/real S3 directly from the Next.js server.
- **Cognito auth is unaffected.** Independent module.

### Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Hidden import of `@aws-sdk/client-sqs`** elsewhere besides `triggerBackgroundSync`. | Pre-removal grep: `rg "@aws-sdk/client-sqs"` confirms only one consumer. After removal, `pnpm typecheck` will surface anything missed. |
| **An existing test exercises the SQS path and would break silently if reduced to disabled-only.** | Audit `features/steam-import/**/*.test.ts` and any integration test under `app/api/steam/sync/`. Remove SQS-dependent assertions; add (or keep) one assertion that the action returns the disabled-error result. |
| **Anyone who has run `terraform apply` on dev or prod will have orphan AWS resources** (Lambdas, SQS queue, ECR repo, Secrets, S3 imports bucket) once their state file references vanish. | PR description includes an explicit "before merging, run `terraform destroy -target=module.steam_import_lambda …` (or `terraform destroy` against the prior state) on any environment you previously applied to" callout. Since state is local per-env, no shared cleanup is automatic. |
| **`ImportedGame` table has no writer after this change.** | Acceptable per functional spec R4 — the `/steam/games` page renders its empty state. We are explicitly preserving the schema for future reuse. No truncation. |
| **Audit artifacts (`context/audits/2026-04-01/*`) reference Lambdas heavily.** | Out-of-scope. Audits are point-in-time snapshots; touching them rewrites history. The next audit will reflect the new state. |
| **Spec 006 / 010 / 012 reference the pipeline in passing.** | Out-of-scope. Historical specs are not edited. |
| **Reviewers need to verify the right things were deleted.** | PR description includes the canonical delete-list (this section 2) so review is grep-vs-list. |
| **R6 reads stronger than reality** ("no Docker"). | Tech spec narrows R6 to mean "no Docker *image build* and no Python/`uv` toolchain"; `docker compose up -d` for postgres + LocalStack remains the dev start command. README/Quick Start wording reflects this. |

### Out-of-band actions required of operators

- Manual `terraform destroy` of any previously-applied pipeline resources (per-env, per-engineer who applied).
- Manual cleanup of AWS Secrets Manager entries `savepoint/{env}/{steam-api-key,igdb-credentials,database-url}` if they were populated (not in state, must be deleted via AWS CLI or console).

Both are flagged in the PR description; neither is a code change.

---

## 4. Testing Strategy

### Automated

- **`pnpm --filter savepoint typecheck`** — must pass; will catch any leftover `STEAM_SYNC_QUEUE_URL` / `ENABLE_STEAM_BACKGROUND_SYNC` reference and any forgotten `@aws-sdk/client-sqs` import.
- **`pnpm --filter savepoint lint`** — must pass; will catch unused imports left over from the gutted action.
- **`pnpm --filter savepoint test`** — full suite (components + backend + utilities). Steam-import unit tests rewritten to assert the disabled-error result. Any test mocking SQS deleted.
- **`pnpm --filter savepoint test:e2e`** — Playwright E2E. Smoke test that Settings → Connections renders, sync button click shows the existing disabled-error toast, `/steam/games` route renders without error.
- **`pnpm --filter savepoint build`** — must succeed.
- **`pnpm --filter savepoint ci:check`** (the umbrella) — must pass before merge.
- **No Python test runner anymore** — confirmed by the Makefile change.

### Manual smoke

1. Fresh checkout of the branch in a clean clone, `pnpm install`, `docker compose up -d`, `pnpm --filter savepoint prisma migrate dev`, `pnpm --filter savepoint dev` — app starts.
2. Sign in, go to Settings → Connections, link Steam, see profile, unlink, see disconnect. (R1, R2)
3. Re-link Steam, click "Sync my Steam library", see the existing "background sync currently disabled / try again later" message; no console error, no white screen. (R3)
4. Navigate to `/steam/games`, see empty state render. (R4)
5. `grep -ri "lambdas-py\|@aws-sdk/client-sqs\|STEAM_SYNC_QUEUE\|ENABLE_STEAM_BACKGROUND" --exclude-dir={node_modules,.next,context/audits,context/spec/002,context/spec/003,context/spec/006,context/spec/010,context/spec/012,context/spec/015,pnpm-lock.yaml}` returns zero hits. (R6, R8)

### Infra

- `cd infra/envs/dev && terraform validate` — passes against the trimmed config (no apply).
- `cd infra/envs/prod && terraform validate` — same.
