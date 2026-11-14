# Technical Specification: Background Steam sync

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail Badiullin (with Claude)

---

## 1. High-Level Technical Approach

The Steam sync moves off the request path to AWS: **SQS + two Lambdas, no S3, triggered only by the user**. The Vercel app creates an `ImportJob` row and sends one message to `gather-q`.

- **λ gather** fetches the Steam library, upserts `ImportedGame` rows and resolves locally whatever the shared `Game` catalogue already knows. It then splits the rest into chunks of ≤ 200 and sends them to `enrich-q`.
- **λ enrich** runs at most 2 at a time. It makes one batched IGDB `/external_games` request per chunk, upserts `Game` rows, links `ImportedGame.gameId`, optionally adds games to the library, and records progress on the job exactly once per chunk.

The web app shows progress by polling a status server fn, and only while a job is active.

What it touches:
- the Prisma schema (new `ImportJob`, `ImportedGame.gameId` / `lookedUpAt`, an index on `Game.steamAppId`);
- a new `features/storefront-sync` slice and a new `entities/import-job` entity;
- `shared/api/igdb` (batch Steam matcher, pacer) and a new `shared/api/queue`;
- an env split (`env.core.ts`);
- a new `src/lambdas/` layer, bundled with esbuild;
- a new isolated Terraform stack `infra/stacks/storefront-sync/`;
- a `deploy-lambdas` job in `deploy.yml`;
- UI changes on the import page, the Steam card and the root shell.

Rationale and cost research: [research-notes.md](./research-notes.md). At hobby scale it fits the AWS always-free tiers.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Architecture

```
Browser ──startSteamSyncFn──► Vercel (TanStack server fn)
                               │ INSERT ImportJob (QUEUED)   ─────────────► Neon
                               │ SQS SendMessage (OIDC role) ─► gather-q ─► λ gather (max conc. 5)
                                                                             │ Steam GetOwnedGames
                                                                             │ upsert ImportedGame, local resolve ──► Neon
                                                                             │ SendMessageBatch (≤200 ids/msg)
                                                               enrich-q ◄────┘
                                                                  └─► λ enrich (max conc. 2, ≤1 IGDB req/msg)
                                                                       IGDB /external_games ─ upsert Game, link gameId,
                                                                       add-all (short tx/game), chunk marker ──► Neon
Browser ◄─getSteamSyncStatusFn (poll only while active)── Vercel ◄── Neon
```

- **Transport port.** `SyncQueue` has two implementations, `sqs` and `inline`, selected by `STOREFRONT_SYNC_QUEUE`.
  - `inline` runs gather and enrich in-process via `setImmediate`, with a `drain()` for tests.
  - Use `inline` for local dev and integration tests. `env.ts` rejects `inline` when `NODE_ENV=production`.
- **Lambda handlers are thin adapters.** Each one parses the SQS event, calls a worker and returns `batchItemFailures`. All policy lives in `features/storefront-sync/api/*.worker.ts`, so the existing coverage gate covers it.
- **Naming.** The folder is `src/lambdas/`, not `src/workers/`, because `*.worker.ts` already means the foot-gun #8 testable server-fn body.

### 2.2 Data Model / Database Changes

There is one additive migration, authored with `prisma migrate dev --create-only`, with raw SQL appended by hand. It follows the `ImportedGame_live_…` precedent and FOOT-GUNS #11.

**New table `ImportJob`**

| Column | Type / default | Notes |
|---|---|---|
| `id` | String cuid PK | |
| `userId` | String FK → user, `onDelete: Cascade` | |
| `storefront` | `Storefront` | reuses the existing enum |
| `status` | `ImportJobStatus` = `QUEUED` | enum `QUEUED, GATHERING, LOOKING_UP, FINISHED, FAILED` |
| `addAllToLibrary` | Boolean = false | |
| `storefrontAccountId` | String | snapshot of `steamId64`, so a disconnect mid-sync still completes (spec 2.6.5) |
| `totalToLookUp`, `lookedUp` | Int = 0 | `lookedUp` starts at the count of locally resolved candidates |
| `totalChunks` | Int = 0 | |
| `doneChunkIndexes` | Int[] = `{}` | per-chunk processed marker (SQS at-least-once) |
| `newGames`, `refreshedGames`, `addedToLibrary`, `needsMatch` | Int = 0 | summary counts (§2.6) |
| `failureCode` | `ImportFailureCode?` | enum `PROFILE_PRIVATE, STEAM_UNAVAILABLE, RATE_LIMITED, STALLED, START_FAILED, UNKNOWN`; the UI maps codes to copy |
| `noticeSeenAt`, `finishedAt` | DateTime? | |
| `createdAt` | DateTime = now() | |
| `updatedAt` | DateTime | doubles as the heartbeat. **Every raw UPDATE sets `"updatedAt" = now()`**, because Prisma's `@updatedAt` doesn't apply to raw SQL. Always use DB `now()`, never the Lambda clock. |

Indexes and constraints:
- `@@index([userId, storefront, createdAt(sort: Desc)])`.
- Raw SQL:
  - partial unique `ImportJob_active_userId_storefront_key` on `(userId, storefront) WHERE status IN ('QUEUED','GATHERING','LOOKING_UP')`;
  - CHECK that counters are ≥ 0;
  - CHECK `cardinality(doneChunkIndexes) <= totalChunks`;
  - CHECK `(status IN ('FINISHED','FAILED')) = (finishedAt IS NOT NULL)`.

**`ImportedGame` changes**

| Change | Notes |
|---|---|
| `gameId String?` → `Game`, `onDelete: SetNull`, `@@index([gameId])` | The catalogue game the sync resolved. Independent of `igdbMatchStatus`, which stays as user curation: `MATCHED` = added to library, `IGNORED` = removed. |
| `lookedUpAt DateTime?` | `null` = not yet looked up. Set with `gameId` = found. Set without `gameId` = needs a match. |

**`Game` change:** add `@@index([steamAppId])`, **not unique**. One Steam app can map to several IGDB games, and several apps can map to one game.

**Backfill:** none.
- Existing `ImportedGame` rows have `lookedUpAt = null`, so the first sync looks them up (spec 2.2.2).
- Legacy `MATCHED` rows keep `gameId = null` and stay excluded, as they are today.

**Future option (not now):** a `(storefront, storefrontGameId) → gameId` mapping table would serve Xbox and PSN better than `Game.steamAppId`. It's deferred under KISS.

### 2.3 Server functions (`features/storefront-sync/api/`, no `.server` suffix)

All three server fns resolve the user with `requireUserId()`, validate twice, and delegate to a worker.

| Server fn | Input | Output | Behaviour |
|---|---|---|---|
| `startSteamSyncFn` (POST) | `{ addAllToLibrary: boolean }` | `{ jobId, status, alreadyRunning }` | 1. No `steamId64` → `ValidationError("Connect Steam first…")`. 2. Expire a stale job, then `INSERT … ON CONFLICT DO NOTHING RETURNING` against the partial index; on conflict, return the active job with `alreadyRunning: true`. This is a normal state, not an error, so no new `AppErrorCode` is needed. 3. Send `{v:1, jobId}` to gather-q; if the send fails, mark the job `FAILED(START_FAILED)` and throw `UpstreamError`. |
| `getSteamSyncStatusFn` (GET) | none | `SteamSyncStatus \| null` | Latest job for (user, STEAM). Fields: `jobId, status, totalToLookUp, lookedUp, newGames, refreshedGames, addedToLibrary, needsMatch, addAllToLibrary, failureCode, finishedAt, noticeSeen`. Applies the lazy stale expiry first (§2.6). |
| `markSyncNoticeSeenFn` (POST) | `{ jobId }` | void | Sets `noticeSeenAt` on that job and on every older finished job of the same user that hasn't been seen. Throws `NotFoundError` if the job isn't the caller's. |

**Entity queries**, each `*.server.ts` throwing `AppError`:

- **`entities/import-job/api/`**
  - `createImportJob`
  - `getLatestImportJob`
  - `expireStaleImportJob`
  - `claimGather` (QUEUED/GATHERING → GATHERING RETURNING; any other state → `null`, ack and drop)
  - `recordGatherPlan`
  - `failImportJob`
  - `recordChunkDone`
  - `finalizeImportJobIfComplete`
  - `markSyncNoticeSeen`
- **`entities/imported-game/api/`**
  - `upsertImportedGamesBatch(userId, games, storefront)` — currently hardcoded to `STEAM`; the storefront becomes a parameter
  - `resolveImportedGamesFromCatalogue`
  - `findLookupCandidates`
  - `applyLookupResults`
  - `findImportedGamesForUser` — gains the Game join and filters
  - `calculateSmartStatus` moves from `features/steam-import/lib` to `entities/imported-game/lib`, because sibling features can't import each other
- **`entities/game/api/`**
  - `upsertGamesFromIgdbBatch(payloads) → Map<igdbId, gameId>` — `createMany skipDuplicates`, then `findMany`; a slug collision is logged and treated as unfound
  - `setGameSteamAppIds(pairs)` — only where `steamAppId IS NULL`

### 2.4 Queue messages and Lambda behaviour

| Queue | Message (zod, `v:1`, unknown fields tolerated) | Lambda settings |
|---|---|---|
| `gather-q` | `{ v, jobId }` | gather: 512 MB, timeout 120 s, `batch_size 1`, max concurrency 5, visibility 720 s, `maxReceiveCount 3` |
| `enrich-q` | `{ v, jobId, chunkIndex, importedGameIds: string[≤200], lookupCount }` | enrich: 512 MB, timeout 60 s, `batch_size 1`, max concurrency 2 (the SQS minimum), visibility 360 s, `maxReceiveCount 3` |

- **Errors.** A schema-invalid message is a poison message: log it and ack. Retryable errors (IGDB 429/5xx/timeout, DB) return the record in `batchItemFailures` and are retried after the visibility timeout. There's no `ChangeMessageVisibility` backoff: three attempts at about 6-minute spacing finish inside the 30-minute stuck window.
- **Gather.**
  1. `claimGather`, then Steam `GetOwnedGames` using the job's snapshot id.
  2. An empty result → `FAILED(PROFILE_PRIVATE)`. Typed Steam errors → `STEAM_UNAVAILABLE` / `RATE_LIMITED`.
  3. `upsertImportedGamesBatch`.
  4. `resolveImportedGamesFromCatalogue`: `UPDATE … FROM (SELECT DISTINCT ON (steamAppId) …)` with int-array binding, so the index is used.
  5. `findLookupCandidates` returns rows that are live, not `IGNORED`, not `MATCHED`, have no `LibraryItem` by `gameId`, and are ordered by id. Rows with `gameId IS NULL` need a lookup; this includes previous needs-a-match rows, which the spec re-checks on every sync. When add-all is on, already-resolved rows are included too.
  6. Chunk deterministically into groups of 200, each carrying its own `lookupCount`.
  7. `recordGatherPlan` writes `totalToLookUp`, `lookedUp`, `refreshedGames`, `totalChunks` and LOOKING_UP in one UPDATE, before sending. If there are zero chunks it finalizes immediately.
  8. `SendMessageBatch` in groups of 10, retrying any `Failed[]` entries.
  - A crash after the plan is recorded but before the send is caught by the 30-minute expiry.
- **Enrich.** Steps 1–3 are all idempotent.
  1. Drop the message unless the job is `LOOKING_UP`, so a stale chunk can't touch a newer job.
  2. Rows that need a lookup → `matchSteamGamesByAppIds` (one request) → `upsertGamesFromIgdbBatch` + `setGameSteamAppIds` → `applyLookupResults` (sets `gameId`/`lookedUpAt`; unfound rows get `lookedUpAt` only).
  3. If add-all is on, for each found row not already in the library, one **short** transaction using `tx` only: skip if a `LibraryItem` exists, else `createWantLibraryItem`, then `setLibraryItemStatusInTx` only when the smart status is PLAYING (it takes `lockUserQueue` itself), then set `MATCHED`. A P2002 on (userId, gameId) counts as skipped. Never make an IGDB call inside a transaction.
  4. `recordChunkDone`: a single `UPDATE … SET doneChunkIndexes = array_append(…), lookedUp += lookupCount, addedToLibrary += added WHERE status='LOOKING_UP' AND NOT (idx = ANY(doneChunkIndexes)) RETURNING …`. `added` = rows in the chunk that are `MATCHED` at the end, which stays correct after a crash and rerun.
  5. Always call `finalizeImportJobIfComplete`.
- **Final attempt.** When `ApproximateReceiveCount ≥ SYNC_MAX_RECEIVE_COUNT` (the same Terraform variable feeds the redrive policy):
  - run `applyLookupResults` with every row unfound, then `recordChunkDone(added = 0)`, then ack;
  - these games show "Needs a match" and are re-checked on the next sync (spec 2.3.3);
  - a crash during the final attempt sends the message to the DLQ, and the job is then caught by the stuck expiry.
- **Logging.** pino child logger with `{jobId, userId, messageId, receiveCount}`; never log `steamId64`. `NODE_ENV=production` is set both by an esbuild `define` and in the Terraform env, because otherwise pino-pretty's worker transport breaks the bundle.

### 2.5 IGDB batch matcher (`shared/api/igdb/match-steam-games.ts`)

- **Query:**
  `fields uid, game.id, game.name, game.slug, game.first_release_date, game.cover.image_id, game.game_type, game.release_dates.date, game.release_dates.date_format, game.release_dates.y, game.release_dates.m, game.release_dates.human; where external_game_source = 1 & uid = ("…",…); limit 500;`
  - `external_games.category` was removed after IGDB's 2026-08 migration.
  - Confirmed live 2026-11-14: Steam's `external_game_source` id is 1, and IGDB rejects the `{a,b}` brace shorthand (HTTP 400) — list expanded field names (research-notes.md).
  - `release_dates` must be in the field list to keep spec 029's precise release dates.
- **Results.** Dedupe per `uid`, preferring the main-game `game_type`, then the lowest id. A row with no `game` counts as unfound.
- **Pacing.** Add `shared/api/igdb/pacer.ts`, a minimum interval between calls set by the optional `IGDB_MIN_INTERVAL_MS`. It's off on the web and 750 ms in the Lambda. The 4 requests/second and 8-open-request limits are shared with web traffic. The token cache in `token.ts` survives warm invocations.

### 2.6 Logic: progress, summary counts, expiry, notice

- **Progress (spec 2.2.1).** "Looking up your games — `lookedUp` of `totalToLookUp`". `totalToLookUp` = candidates (not removed, not in the library). Locally resolved rows count immediately.
- **Summary (spec 2.5.1).**

  | Count | Computed | Definition |
  |---|---|---|
  | `refreshedGames` | at gather, before any adds | Rows created before the job that are not `IGNORED`, not `MATCHED`, and not in the library by `gameId`. These are exactly the games shown on the import page before the sync. |
  | `newGames` | at finalize | Rows with `createdAt ≥ job.createdAt` that have no `LibraryItem` for their `gameId` created before the job. |
  | `needsMatch` | at finalize | Live, not-`IGNORED` rows for this storefront with `lookedUpAt` set and `gameId` null. |
  | `addedToLibrary` | per chunk | Accumulated through `recordChunkDone`. |

- **Stuck expiry (spec 2.6.4).** `expireStaleImportJob` runs `UPDATE … SET status='FAILED', failureCode='STALLED', finishedAt=now() WHERE status IN active AND updatedAt < now() - interval '30 minutes'`. It runs on reads and before creating a job, so there is no sweeper. Every gather and chunk write bumps `updatedAt`.
- **Notice (spec 2.5).**
  - The toast fires when the latest job is `FINISHED` or `FAILED` and `noticeSeen` is false.
  - Closing the toast or pressing "Review games" calls `markSyncNoticeSeenFn`.
  - Other tabs dismiss their toast by `id` once their next poll sees `noticeSeen`. While a finished notice is still unseen, those tabs keep polling every 20 s.
  - There is no `BroadcastChannel`.

### 2.7 UI components (FSD)

| Component | Placement | Notes |
|---|---|---|
| `SyncStartButton` + confirm dialog | `features/storefront-sync/ui/sync-start-button/` | Base UI `Dialog` + `Checkbox`. `connected=false` renders a "Connect Steam to sync" link. When `alreadyRunning` is set, shows "A sync is already running". |
| `SyncProgress` (`variant: page \| card`) | `features/storefront-sync/ui/sync-progress/` | Reads the shared status query. `role="status"` / `aria-live="polite"` announces stage changes only; the count sits in an `aria-hidden` span. Numbers use `toLocaleString("en-US")` so server and client renders match. |
| `SyncFailureAlert` | `features/storefront-sync/ui/sync-failure-alert/` | Maps `failureCode` to spec copy. Shown until the next sync starts. |
| `SyncNoticeHost` (renders null) | `features/storefront-sync/ui/sync-notice-host/`, mounted in `RootShell` next to `GlobalActionHost` for authed users | Fires sonner toasts (`duration: Infinity`, `id` per job) from an effect, never during render. Includes `formatSyncSummary` (pure): drops zero parts, singular for 1, joins with " · ". |
| Imported-game card states | `features/steam-import/ui/imported-game-card/` | A pure `matchState(row)` → `found \| needs-match \| not-yet`. Found: catalogue cover (falls back to the Steam icon), title, year. `ImportGameModal` gets `startOnSearch` (true for needs-match) and skips the matching step for found games. |
| Import page widget | `widgets/imported-games-page/` | Composes the sync components. The warning shows only for needs-match rows and uses the new copy. Calls `router.invalidate()` when `lookedUp` or the status changes, at most once per poll. Clamps the page in the loader, because add-all removes rows while the sync runs. |
| Steam card | `features/steam-connect/ui/steam-connect-card/` | New `syncSlot?: ReactNode` prop. `routes/_authed/settings/account.tsx` passes `<SyncProgress variant="card"/>`, so `steam-connect` never imports `storefront-sync`. |

- **Polling.** All three components share the query key `["storefront-sync","status","STEAM"]`.
  - `SyncNoticeHost` fetches once per app load (staleTime 60 s), then polls every 20 s while a job is active or a notice is unseen.
  - `SyncProgress` and the import page poll every 3 s while a job is active. TanStack Query uses the fastest interval among active observers.
  - Hidden tabs don't poll.
- **Copy.**
  - Delete the `import-status-feedback` toasts and their exports (spec 2.7.2).
  - Replace the `whats-new` Steam entry text (spec 2.7.1) and bump `CURRENT_VERSION`.
  - Update the empty state to "Sync your Steam library to see your games here."

### 2.8 Environment and configuration

- **Env split.**
  - `env.core.ts` (`coreEnv`): `POSTGRES_PRISMA_URL`, `IGDB_*`, `STEAM_API_KEY`, `NODE_ENV`, `LOG_LEVEL`, and the optional `STEAM_SYNC_ENRICH_QUEUE_URL`, `DB_POOL_MAX`, `IGDB_MIN_INTERVAL_MS`, `SYNC_MAX_RECEIVE_COUNT`.
  - `env.ts` = `createEnv({ extends: [coreEnv], server: { web-only… } })`; web behaviour is unchanged.
  - `env.lambda.ts` re-exports `coreEnv`.
  - `tsconfig.lambdas.json` maps `@env` → `env.lambda.ts`, and esbuild uses the same tsconfig. Any web-only env read in the Lambda import graph fails `typecheck:lambdas`.
  - Workers import leaf modules, not barrels; for example `shared/api/steam/steam-fetch`, because the barrel pulls in `openid.ts` and with it the Better Auth vars.
- **New web vars:**
  - `STOREFRONT_SYNC_QUEUE` (`sqs | inline`)
  - `STEAM_SYNC_GATHER_QUEUE_URL`
  - `AWS_SYNC_ROLE_ARN`
  - The existing `AWS_REGION` must be pinned explicitly on Vercel.
- **SQS client (web).** `@aws-sdk/client-sqs` pinned exactly at `3.1024.0`, the same version as `client-s3`. Credentials come from `@vercel/oidc-aws-credentials-provider` (pinned exactly), created per request inside the server fn, never at module scope. The S3 client keeps its existing static keys.
- **DB pool.** `db.server.ts` reads `DB_POOL_MAX`: 2 in the Lambdas, the pg default on the web. Add `connectionTimeoutMillis` ≥ 10 s, a short idle timeout and a `pool.on("error")` handler, because frozen Lambdas lose idle Neon sockets. Use Neon's pooled URL.
- **Lambda secrets.** Store them in SSM SecureString under `/savepoint/<env>/storefront-sync/*`, not in Lambda env vars, so they stay out of Terraform state. The handler entry fetches them with one `GetParameters` call per cold start, sets `process.env`, then dynamically `import()`s the worker graph.

### 2.9 Bundling and linting

- **Build.** `scripts/build-lambdas.mjs` uses the esbuild JS API (esbuild added as an exact-pinned devDependency).
  - Settings: `platform node`, `target node22`, `format esm` (`.mjs`). ESM is required because the Prisma 7 client relies on `import.meta.url`.
  - Add a `createRequire` banner for pg and pino.
  - Other options: `tsconfig.lambdas.json`, `external: ["pg-native"]`, a sourcemap with `--enable-source-maps`, and a metafile.
  - Output: deterministic zips in `dist-lambdas/` (gitignored).
  - Scripts: `build:lambdas` runs `prisma generate` first (needs a dummy DB URL in CI); also `typecheck:lambdas`.
- **Smoke check (`scripts/smoke-lambda-bundle.mjs`, run in CI).** The metafile must contain no `@tanstack`, `better-auth`, `react` or S3 modules. Each handler must import with only the core env set and ack a malformed record.
- **ESLint.**
  - Add a boundaries element `lambdas` (`src/lambdas/**`), allowed to import `feature`, `entity` and `shared`; nothing may import it.
  - Add `no-restricted-imports` under `src/lambdas/**`: `@tanstack/*`, `react*`, `better-auth`, `@/routes|widgets|app`, and any feature import that isn't `/api/*.worker`.
  - Add a regression case to `test/eslint/`.

### 2.10 Infrastructure (`infra/stacks/storefront-sync/`)

- **Layout.** A new isolated stack with `modules/pipeline/`, `shared/`, `dev/` and `prod/`.
  - It never touches or reads the stateless `infra/envs/*` roots, whose live Cognito and S3 were edited by hand.
  - Backend: S3 with `use_lockfile = true` and versioning; the bucket is bootstrapped once with 3 documented commands.
  - Pins: Terraform `= 1.14.6`, AWS provider `= 6.73.0`, `terraform-aws-modules/sqs/aws 5.2.2`, `terraform-aws-modules/lambda/aws 8.13.0`.
  - Tags: `local.required_tags` merged into every resource, following the `infra/CLAUDE.md` pattern.
- **Resources (per env).**
  - 2 queues, each with a DLQ: retention 4 days, DLQ 14 days, SSE-SQS.
  - 2 Lambdas: `nodejs22.x`, arm64, created from a committed stub with `ignore_source_code_hash`, since code ships from CI.
  - Event source mappings with `ReportBatchItemFailures` and `scaling_config.maximum_concurrency`. No reserved concurrency, because new accounts have a quota of 10.
  - Explicit log groups with 7-day retention.
  - 4 SSM SecureString params, created with a placeholder and `ignore_changes=[value]`; real values are set with `aws ssm put-parameter`.
- **`shared/` (account singletons).** The IAM OIDC providers for Vercel (`https://oidc.vercel.com/<team>`, Team issuer mode) and GitHub. If a GitHub provider already exists, import it.
- **IAM (least privilege, ARN-scoped).**

  | Role | Trust | Permissions |
  |---|---|---|
  | `vercel-sqs-send` | Vercel OIDC, `sub = owner:<team>:project:<project>:environment:production` | `sqs:SendMessage` on gather-q only |
  | `gather` | Lambda | receive/delete/attributes on gather-q; `sqs:SendMessage` on enrich-q; logs on its own group; `ssm:GetParameters` on its prefix; `kms:Decrypt` via SSM |
  | `enrich` | Lambda | the same, scoped to enrich-q, with no send |
  | `github-lambda-deploy` | GitHub OIDC, `repo:NeiruBugz/play-later-v2:environment:production` | `lambda:UpdateFunctionCode`, `GetFunction`, `GetFunctionConfiguration` on the 2 functions |

- **Outputs → env.**
  - `gather_queue_url` → Vercel `STEAM_SYNC_GATHER_QUEUE_URL`
  - `vercel_sqs_role_arn` → `AWS_SYNC_ROLE_ARN`
  - `enrich_queue_url` → Lambda env
  - function names and the deploy role → GitHub repo variables
- **Code deploy.** A new `deploy-lambdas` job in `deploy.yml` with `needs: migrate`. Steps: install → `prisma:generate` → `build:lambdas` → smoke check → `aws-actions/configure-aws-credentials` (OIDC) → `aws lambda update-function-code --architectures arm64` → `aws lambda wait function-updated`. This keeps the bundled Prisma client in lockstep with migrations.
- **PR checks.** `pr-checks-tanstack.yml` gains `typecheck:lambdas`, `build:lambdas` and the smoke check.
- **Deferred:** DLQ alarms (CloudWatch alarm on visible messages > 0).

---

## 3. Impact and Risk Analysis

- **System dependencies.**
  - Neon: about 14 connections at peak (gather 5×2 + enrich 2×2) via the pooler.
  - IGDB: the request limit is shared with web traffic.
  - Steam Web API.
  - Vercel OIDC (Team issuer mode, project and environment names baked into the trust policy).
  - GitHub Actions OIDC.
  - `lockUserQueue` / `setLibraryItemStatusInTx` for PLAYING adds.
  - The root shell (a new global host).
  - The `whats-new` modal, which will reappear for every user after the version bump.
- **Docs to update:**
  - `context/product/architecture.md`: §4 Steam (the "paused on dependency" line is stale), §5 infra, §6 observability (CloudWatch logs for the Lambdas), and an ADR for the SQS + Lambda pipeline.
  - `savepoint-tanstack/CLAUDE.md` and FOOT-GUNS (the env split, the `src/lambdas` layer, the raw-SQL partial index).
  - `infra/CLAUDE.md` (the new stack, state bootstrap, secret rotation checklist).
  - Spec 003's on-demand matching, which this spec supersedes.

| Risk | Mitigation |
|---|---|
| SQS at-least-once delivery double-counts progress | Chunk-index marker in one atomic UPDATE; every write is idempotent (skipDuplicates, `WHERE steamAppId IS NULL`, skip-if-exists + P2002 catch); a gather redelivery after LOOKING_UP is dropped |
| A crash between gather's plan and its send stalls the job | The 30-minute lazy expiry lets the user sync again |
| IGDB field drift (`category` → `external_game_source`) | Pinned fixture + a one-off live smoke script; the matcher has its own unit tests |
| IGDB 429 under shared load | Concurrency 2 × ≤1 request per message, 750 ms pacer, SQS retry; the final attempt degrades to "Needs a match" instead of failing the sync |
| The Lambda bundle drags in web-only code or env | `tsconfig.lambdas.json` typecheck, the lint rule, and the metafile assertion in CI |
| Prisma client in the Lambda drifts from the migrated schema | `deploy-lambdas` runs after `migrate` on the same commit; migrations stay additive (expand/contract) |
| Vercel and the Lambdas deploy independently | Versioned, additive message schemas (`v:1`, unknown fields tolerated) |
| Neon idle sockets dropped while Lambdas are frozen | Pool error handler, idle timeout, connection timeout ≥ 10 s |
| Pool of 1 deadlocks a transaction | `DB_POOL_MAX=2`; transactions use only `tx` |
| Advisory-lock contention with the user's own UI | One short transaction per game; no network call inside a transaction |
| Polling cost on Vercel Hobby (1M invocations) | Polls only while a job is active or a notice is unseen; one status read per app load; hidden tabs don't poll |
| Terraform state loss (the existing roots have none) | Separate stack with S3 backend, versioning and a lockfile; existing roots untouched |
| Secrets in state or the console | SSM SecureString with `ignore_changes`, fetched at cold start |
| A non-unique `steamAppId` resolves ambiguously | `DISTINCT ON (steamAppId) ORDER BY createdAt`; a second app id for the same game falls back to IGDB |
| Vercel Preview deployments can't sync | Only prod is wired to SQS; Preview runs without a queue URL and shows sync as unavailable (owner decision, §5) |

---

## 4. Testing Strategy

Every slice follows TDD: write the failing test first, then the code (repo methodology).

- **Unit** (jsdom project, Prisma mocked):
  - `matchSteamGamesByAppIds`: query shape, dedupe, missing `game`, `release_dates` present.
  - The pacer.
  - Message schemas and chunking.
  - `calculateSmartStatus` after the move.
  - `formatSyncSummary` (table-driven).
  - `matchState`.
  - Lambda `handler.test.ts`: event parsing, `batchItemFailures` shape, poison message ack, final-attempt branch.
- **Component** (elements/actions vocabulary, given/when/then):
  - `SyncStartButton`: dialog, cancel, ticked box, already running, connected vs disconnected.
  - `SyncProgress`: stages, numbers update without a reload, hidden when idle, live region.
  - `SyncFailureAlert` (per code).
  - `SyncNoticeHost`: fires once per job, summary text, "Review games" marks the notice seen and navigates, failed variant, dismissal once seen.
  - Imported-game card: three states.
  - Import page: warning rule, invalidate on progress, found vs needs-a-match modal entry, disconnected with games.
  - Steam card `syncSlot`.
  - Update the existing `import-status-feedback` and `whats-new` tests.
- **Integration** (`test/integration/`, real PostgreSQL, `inline` queue, IGDB and Steam fetch stubbed):
  - A full sync with and without add-all.
  - Local resolution counts immediately.
  - Re-check of previously needs-a-match games.
  - Redelivery idempotency for a duplicate chunk and a duplicate gather.
  - The final attempt produces needs-a-match.
  - An empty library → PROFILE_PRIVATE.
  - Concurrent start → one job (partial index).
  - Lazy stale expiry.
  - Notice-seen semantics for older jobs.
  - Add-all skips the library, IGNORED rows and unfound games, and keeps PLAYING for recent games.
  - Disconnect mid-sync still finishes.
  - Summary counts match their definitions.
- **Static and CI:** `test/eslint/` case for the `lambdas` element; `typecheck:lambdas`; `build:lambdas` with the bundle smoke check.
- **Manual (before rollout):**
  - Terraform `plan` on a clean stack.
  - A Vercel Preview OIDC smoke test (assume the role, send one message).
  - The live IGDB `external_game_source` check.
  - One real sync against the prod stack with a test Steam account: 1,000 games in ≤ 5 minutes (spec 2.2.3).

---

## 5. Decisions and remaining assumptions

**Confirmed by owner (2026-11-14):**
- **Code deploy:** Lambda code ships from `deploy.yml` (`deploy-lambdas`, `needs: migrate`) via GitHub OIDC.
- **Environments:** prod stack only. Local dev and integration tests use `inline`; Vercel Preview has no sync (no queue URL → sync shown as unavailable).
- **Terraform state:** S3 backend (versioned, `use_lockfile`), bootstrapped once by hand.
- **`whats-new`:** bump `CURRENT_VERSION`.

**Assumptions (not yet confirmed):**
- `Game.steamAppId` stays single-valued and non-unique; no mapping table yet.
- Terraform CLI pinned at `1.14.6`.
- Max concurrency: gather 5, enrich 2.
- The Lambda region matches Neon and Vercel (Neon region not verified).
