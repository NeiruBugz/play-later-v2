# Tasks: Retire Lambdas Pipeline

> Each slice leaves the app bootable and CI green. Run `pnpm --filter savepoint ci:check` after every slice.

## Slice 1 — Sever the SQS dependency in-app

**Outcome:** The app no longer imports `@aws-sdk/client-sqs`, `triggerBackgroundSync` returns the existing disabled-error, all Steam UI surfaces still render. `lambdas-py/` and infra modules are still on disk but no longer referenced from app code.

- [x] Replace `features/steam-import/server-actions/trigger-background-sync.ts` body with the existing "background sync currently disabled" `ActionResult`. Drop `SQSClient`, `SendMessageCommand`, `ProfileService` calls, `SteamSyncMessage` interface. Keep `actionName`, schema, signature unchanged. **[Agent: nextjs-expert]**
- [x] Hardcode `steamImportConfig.isBackgroundSyncEnabled = false` in `features/steam-import/config.ts`; drop the `env.ENABLE_STEAM_BACKGROUND_SYNC` reference. **[Agent: nextjs-expert]**
- [x] Remove `ENABLE_STEAM_BACKGROUND_SYNC` and `STEAM_SYNC_QUEUE_URL` from `savepoint-app/env.mjs` (`runtimeEnv` + `server` blocks) and from `savepoint-app/.env.example`. **[Agent: nextjs-expert]**
- [x] Remove `@aws-sdk/client-sqs` from `savepoint-app/package.json`; run `pnpm install` to refresh `pnpm-lock.yaml`. **[Agent: nextjs-expert]**
- [x] Audit `features/steam-import/**/*.test.ts` and any `app/api/steam/sync` integration tests; remove SQS-mocking assertions; ensure at least one assertion that the action returns the disabled-error response. **[Agent: typescript-test-expert]**
- [x] Add a "pipeline retired — see spec 015" note at the top of `features/steam-import/CLAUDE.md`. **[Agent: nextjs-expert]**
- [x] **Verify:** run `pnpm --filter savepoint typecheck`, `lint`, `test`, `build`. All green. Then run `pnpm --filter savepoint dev`, sign in, click "Sync my Steam library" → confirm existing disabled-error toast renders, no console errors; navigate `/steam/games` → empty state renders. **[Agent: typescript-test-expert]** _(automated checks green; manual UI smoke deferred to human QA)_

## Slice 2 — Delete `lambdas-py/` and detach repo plumbing

**Outcome:** Python source gone. `make`/CI never invokes `uv` or `pytest` against Python. Root docs no longer reference `lambdas-py`. App and CI are green.

- [x] `rm -rf lambdas-py/`. **[Agent: general-purpose]**
- [x] Edit `Makefile`: strip `&& cd lambdas-py && uv run …` from `test`, `lint`, `format`, `typecheck` targets. **[Agent: general-purpose]**
- [x] Edit root `CLAUDE.md`: drop the `lambdas-py/` row from the architecture table, the `lambdas-py/CLAUDE.md` and `infra/CLAUDE.md`-Lambda look-up rows, the "Trigger Steam import locally" row, and the entire `lambdas-py` "Commands by Layer" section. **[Agent: general-purpose]**
- [x] Edit root `README.md`: remove identical references — keep app + infra (Cognito/S3) onboarding intact. **[Agent: general-purpose]**
- [x] Audit `.github/workflows/{pr-checks,e2e,integration,deploy}.yml` for any `lambdas-py`, `uv`, `python-version`, `setup-python` steps; remove. **[Agent: general-purpose]**
- [x] Edit `.github/dependabot.yml`: remove the `pip` / `lambdas-py` ecosystem entry; keep npm + Terraform entries. **[Agent: general-purpose]**
- [x] **Verify:** `make test` (or the trimmed equivalent) runs and finishes without invoking Python; `pnpm --filter savepoint ci:check` green; `rg "lambdas-py" --glob '!context/audits/**' --glob '!context/spec/00[2,3,6]/**' --glob '!context/spec/010/**' --glob '!context/spec/012/**' --glob '!context/spec/015/**' --glob '!pnpm-lock.yaml'` returns zero hits. **[Agent: general-purpose]** _(integration tests pre-existing fail due to LocalStack not running locally; one stale comment in `igdb-matcher.ts` deferred to Slice 5 sweep)_

## Slice 3 — Delete pipeline-only Terraform

**Outcome:** `infra/` only contains the Cognito and S3 (app-assets) modules. `terraform validate` passes in both envs.

- [x] Delete module directories: `infra/modules/{lambda-container,lambda-imports-bucket,steam-import,ecr,secrets}`. **[Agent: terraform-infrastructure]**
- [x] Edit `infra/envs/dev/main.tf`: remove `module` blocks for `ecr`, `lambda_secrets`, `lambda_imports_bucket`, `steam_import_queue`, `steam_import_lambda`, `igdb_enrichment_lambda`, `database_import_lambda`. Preserve `cognito` and `s3` blocks and their outputs verbatim. **[Agent: terraform-infrastructure]**
- [x] Mirror the same edits in `infra/envs/prod/main.tf`. **[Agent: terraform-infrastructure]**
- [x] Edit `infra/envs/{dev,prod}/variables.tf`: drop `lambda_log_level`, `enable_steam_import_event_source`, `steam_import_sender_principals`. **[Agent: terraform-infrastructure]**
- [x] Edit `infra/envs/{dev,prod}/terraform.tfvars.example`: strip the same pipeline vars. **[Agent: terraform-infrastructure]**
- [x] Edit `infra/CLAUDE.md`: drop pipeline modules from the inventory table; remove pipeline-specific gotchas (`sender_principals`, Lambda image / ECR push order, `enable_steam_import_event_source`, `steam_import_lambda` concurrency, `database_import_lambda` VPC TODO). Keep Cognito + S3 sections. **[Agent: terraform-infrastructure]**
- [x] **Verify:** `cd infra/envs/dev && terraform init -backend=false && terraform validate` passes; same for `prod/`; `rg "lambda|sqs|ecr|secrets" infra/ -i` only matches comments / unrelated content. **[Agent: terraform-infrastructure]**

## Slice 4 — Roadmap & spec status

**Outcome:** Roadmap signals the new reality; this spec moves to In Review.

- [x] Edit `context/product/roadmap.md`: prepend Phase 3 with a blockquote `> **Blocked — Lambda pipeline removed in spec 015. Items below require the pipeline to be rebuilt before they can ship.**`. Items themselves stay listed and unchecked. **[Agent: general-purpose]**
- [x] Edit `context/product/roadmap.md`: remove Phase 5 item ARCH-06 ("Decompose Oversized Lambda Modules"). Renumber subsequent Phase 5 items if needed. **[Agent: general-purpose]**
- [x] Bump `Status:` from `Draft` → `In Review` in `context/spec/015-retire-lambdas-pipeline/functional-spec.md` and `technical-considerations.md`. **[Agent: general-purpose]**
- [x] **Verify:** roadmap renders without orphan list numbering; `rg "ARCH-06"` returns zero hits across `context/product/`. **[Agent: general-purpose]**

## Slice 5 — Final cross-repo grep + PR description

**Outcome:** Single PR description carries the operator callouts; canonical grep confirms cleanup.

- [x] Run final canonical grep and capture in PR notes: `rg "lambdas-py|@aws-sdk/client-sqs|STEAM_SYNC_QUEUE|ENABLE_STEAM_BACKGROUND|ARCH-06" --glob '!node_modules' --glob '!.next' --glob '!context/audits/**' --glob '!context/spec/00[236]/**' --glob '!context/spec/010/**' --glob '!context/spec/012/**' --glob '!context/spec/015/**' --glob '!pnpm-lock.yaml'` returns zero hits. **[Agent: general-purpose]** _(zero hits in active source/config/docs; remaining hits are confined to historical specs 002/003/004/006 and one stale wording in `roadmap.md` cross-layer note — out of scope per §2.4)_
- [x] Draft PR description that includes: (a) link to spec 015, (b) the "manual `terraform destroy` required for any previously-applied environment" callout, (c) the "manual cleanup of AWS Secrets Manager entries `savepoint/{env}/{steam-api-key,igdb-credentials,database-url}`" callout, (d) the canonical delete-list from tech spec §2 so review is grep-vs-list. **[Agent: general-purpose]** _(saved to `/tmp/spec-015-pr-description.md`, 7752 bytes)_

---

### Required services (already present)

- `docker compose up -d` (postgres + pgadmin + localstack) — required for Slice 1 verification. No new MCPs or services needed.
