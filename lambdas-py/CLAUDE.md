# lambdas-py — Claude Context

AWS Lambda pipeline that imports and enriches Steam game libraries into the SavePoint PostgreSQL database. Three Lambdas run in sequence: fetch from Steam → enrich via IGDB → write to DB.

## Runtime & Tooling

- **Python**: 3.12 (strict mypy, ruff, py.typed marker present)
- **Package manager**: `uv` — always use `uv run` prefix; never invoke `python` or `pytest` directly
- **Build backend**: hatchling; package root is `src/lambdas`
- **Deployment**: Docker container images pushed to ECR; Terraform in `../infra/`

## Key Commands

```bash
uv sync --all-extras          # install all deps including dev
uv run pytest                 # all tests (unit + integration)
uv run pytest -m unit         # unit only (fast, mocked)
uv run pytest -m integration  # integration (requires real credentials)
uv run pytest -m slow         # full end-to-end pipeline (~30-60s)
uv run ruff check src/        # lint
uv run ruff check --fix src/  # auto-fix lint
uv run mypy src/              # type-check (strict mode)
uv run pytest --cov           # with coverage report
```

## Lambda Inventory

| Handler module | Entry point | Input | Output |
|---|---|---|---|
| `handlers/steam_import.py` | `handler(event, ctx)` | `{user_id, steam_id64, limit?}` | `{success, s3_location, game_count}` |
| `handlers/igdb_enrichment.py` | `handler(event, ctx)` | `{user_id, s3_location}` | `{success, s3_enriched_location, stats}` |
| `handlers/database_import.py` | `handler(event, ctx)` | `{user_id, s3_enriched_location}` | `{success, stats}` |
| `handlers/hello.py` | `handler(event, ctx)` | any | health-check response |

**Pipeline flow**: Lambda 1 → raw CSV in S3 → Lambda 2 → enriched CSV in S3 → Lambda 3 → PostgreSQL

## Architecture Conventions

- **Handlers** validate input with Pydantic, call internal `_async_impl()`, return `model.model_dump()`
- **Clients** (`clients/`) are async context managers (`async with SteamClient(...) as c`)
- **Services** (`services/`) are synchronous; `database.py` exposes upsert functions that take dataclass args
- **Config** is a singleton via `get_settings()` backed by `@lru_cache`; tests must call `get_settings.cache_clear()` (the root `conftest.py` does this automatically via `autouse`)
- All custom exceptions inherit `LambdaError`; handlers catch domain errors and return `success=False` rather than raising

## Critical Gotchas

**Event loop in `igdb_enrichment`**: a module-level `_loop = asyncio.new_event_loop()` is created at import time and reused across invocations via `_loop.run_until_complete(...)`. `steam_import` uses `asyncio.run()` instead. Do not change these without understanding the Lambda warm-start model.

**Dependency upper bounds are intentional** — do not bump these without testing:
- `httpx<0.28` — 0.28.1 broke SSL shortcuts
- `pydantic-settings<3.0` — 2.12.0 changed env prefix resolution order
- `sqlalchemy<3.0` — 3.x has breaking ORM execution model changes

**Docker builds must use `uv sync --frozen`** — never `uv sync` without `--frozen`/`--locked` in Dockerfiles to guarantee reproducible Lambda images.

**Genre/platform names in enriched CSV are numeric IGDB IDs stored as `"Genre {id}"` placeholders** — actual names require a separate enrichment job. `database_import` warns and skips textual names.

**Integration tests** load credentials from `.env.integration` (not `.env`) and auto-skip if credentials are missing. Use a Steam account with 10–50 games; 200+ game libraries can take 10+ minutes.

**mypy is strict** (`strict = true` + pydantic plugin). All function signatures need full annotations. `# type: ignore` should not be added without a comment explaining why.

## Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `STEAM_API_KEY` | yes | SecretStr |
| `IGDB_CLIENT_ID` | yes | Twitch app client ID |
| `IGDB_CLIENT_SECRET` | yes | SecretStr |
| `DATABASE_URL` | yes | Must start with `postgresql://` |
| `S3_BUCKET` | yes | intermediate CSV storage |
| `AWS_REGION` | no | default `us-east-1` |
| `LOG_LEVEL` | no | default `INFO` |

Integration tests also need `TEST_USER_ID`, `TEST_STEAM_ID`, and `AWS_ENDPOINT_URL` (LocalStack or real AWS).

Secrets in production are stored in AWS Secrets Manager under `savepoint/{env}/steam-api-key`, `savepoint/{env}/igdb-credentials`, `savepoint/{env}/database-url`.
