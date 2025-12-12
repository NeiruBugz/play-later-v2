# Technical Specification: Steam Library Import Pipeline (Python Lambdas)

- **Functional Specification:** `context/spec/005-steam-import-pipeline/functional-spec.md`
- **Status:** Draft
- **Author(s):** Claude

---

## 1. High-Level Technical Approach

Create a new `lambdas-py/` package in the monorepo containing three AWS Lambda functions written in Python 3.12:

1. **Lambda 1 (steam_import):** Fetches Steam library → uploads raw CSV to S3
2. **Lambda 2 (igdb_enrichment):** Downloads CSV → classifies apps → enriches with IGDB → uploads enriched CSV
3. **Lambda 3 (database_import):** Downloads enriched CSV → upserts to PostgreSQL

**Key Benefits:**

- Independent retry capability for each stage
- S3 as durable intermediate storage
- Clear observability boundaries
- 15-minute Lambda timeout supports large libraries (2000+ games)

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Architecture / Directory Structure

```
lambdas-py/
├── pyproject.toml           # uv configuration
├── .python-version          # Python 3.12
├── src/
│   └── lambdas/
│       ├── __init__.py
│       ├── config.py        # Pydantic Settings
│       ├── logging.py       # structlog configuration
│       ├── errors.py        # Custom exceptions
│       ├── clients/
│       │   ├── __init__.py
│       │   ├── s3.py        # S3 upload/download
│       │   ├── steam.py     # Steam Web API
│       │   └── igdb.py      # IGDB with rate limiting
│       ├── services/
│       │   ├── __init__.py
│       │   ├── classifier.py    # Steam app classifier
│       │   └── database.py      # SQLAlchemy operations
│       ├── handlers/
│       │   ├── __init__.py
│       │   ├── steam_import.py      # Lambda 1
│       │   ├── igdb_enrichment.py   # Lambda 2
│       │   └── database_import.py   # Lambda 3
│       └── models/
│           ├── __init__.py
│           ├── steam.py     # Steam Pydantic models
│           ├── igdb.py      # IGDB Pydantic models
│           └── db.py        # SQLAlchemy models
└── tests/
    ├── conftest.py
    ├── unit/
    └── integration/
```

### 2.2 Data Model / Database Changes

**Schema Migration (via Prisma in savepoint-app):**

```prisma
model ImportedGame {
  // ... existing fields
  igdbMatchStatus IgdbMatchStatus @default(PENDING)
}

enum IgdbMatchStatus {
  PENDING
  MATCHED
  UNMATCHED
  IGNORED
}
```

**Tables Accessed:**

| Table | Operations |
|-------|------------|
| `ImportedGame` | Upsert by `storefrontGameId` + `userId` |
| `Game` | Upsert by `igdbId`, fallback by `steamAppId` |
| `LibraryItem` | Create with status based on playtime (0 → CURIOUS_ABOUT, >0 → EXPERIENCED) |
| `Genre`, `Platform` | Upsert by `igdbId` |
| `GameGenre`, `GamePlatform` | Insert on game creation |

### 2.3 API Contracts

**Lambda 1: steam_import**

```python
# Event
class SteamImportEvent(BaseModel):
    user_id: str
    steam_id64: str

# Response
class SteamImportResponse(BaseModel):
    success: bool
    s3_location: str | None = None
    game_count: int | None = None
    error: str | None = None
```

**Lambda 2: igdb_enrichment**

```python
class IgdbEnrichmentEvent(BaseModel):
    user_id: str
    s3_location: str

class IgdbEnrichmentResponse(BaseModel):
    success: bool
    s3_enriched_location: str | None = None
    stats: EnrichmentStats | None = None
    error: str | None = None

class EnrichmentStats(BaseModel):
    processed: int
    matched: int
    unmatched: int
    filtered: int
```

**Lambda 3: database_import**

```python
class DatabaseImportEvent(BaseModel):
    user_id: str
    s3_enriched_location: str

class DatabaseImportResponse(BaseModel):
    success: bool
    stats: ImportStats | None = None
    error: str | None = None

class ImportStats(BaseModel):
    imported_games_created: int
    imported_games_updated: int
    games_created: int
    games_updated: int
    library_items_created: int
```

**S3 Path Convention:**

- Raw: `s3://{bucket}/imports/{user_id}/{timestamp}-raw.csv`
- Enriched: `s3://{bucket}/imports/{user_id}/{timestamp}-enriched.csv`

### 2.4 Component Details

**Dependencies:**

```toml
[project]
dependencies = [
    "boto3>=1.35.0",
    "httpx>=0.27.0",
    "pydantic>=2.9.0",
    "pydantic-settings>=2.5.0",
    "sqlalchemy>=2.0.0",
    "asyncpg>=0.29.0",
    "structlog>=24.0.0",
    "tenacity>=9.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=5.0.0",
    "ruff>=0.6.0",
    "mypy>=1.11.0",
    "moto[s3]>=5.0.0",
]
```

**IGDB Client Features:**

- OAuth2 token management (Twitch API)
- Rate limiting: 4 req/sec via `asyncio.Semaphore`
- In-memory cache (1-hour TTL, positive + negative caching)
- Retry with exponential backoff (`tenacity`)

**Steam App Classifier Rules:**

| Pattern | Classification | Action |
|---------|---------------|--------|
| `"- Multiplayer"`, `"- Multi-Player"` | MULTIPLAYER_COMPONENT | Filter |
| `"- DLC"`, `"Season Pass"`, `"Expansion"` | DLC | Filter |
| `"- Demo"`, `"- Soundtrack"`, `"Editor"` | NON_GAME | Filter |
| Default | GAME | Enrich |

---

## 3. Impact and Risk Analysis

### System Dependencies

| Dependency | Mitigation |
|------------|------------|
| Steam Web API | Retry with backoff; clear error for private profiles |
| IGDB/Twitch API | Adaptive rate limiting; token refresh with 60s buffer |
| S3 | AWS 99.99% SLA; retry with backoff |
| PostgreSQL | Connection pooling; transaction rollback on error |
| Prisma Schema | Integration tests validate model sync |

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Large library timeout (2000+ games) | 15-min Lambda timeout; batch IGDB requests |
| IGDB rate limit exceeded | Semaphore (4 req/sec); exponential backoff |
| Schema drift (Prisma vs SQLAlchemy) | Integration tests against real DB |
| Cold start latency (~1.5s) | Acceptable for async pipeline |
| Partial import failure | Idempotent Lambdas; S3 checkpoints |

---

## 4. Testing Strategy

### Unit Tests

- Classifier logic, client error handling, event validation
- Mocked external dependencies (`moto` for S3, `respx` for HTTP)
- Target: 50-80 tests, <10s execution

### Integration Tests

- Real external APIs with dev environment credentials
- Real PostgreSQL and S3
- Full pipeline end-to-end validation

```bash
# .env.integration (dev credentials)
TEST_USER_ID=<dev-user-id-from-database>
STEAM_API_KEY=<dev-key>
STEAM_ID64=<test-user-steam-id>
IGDB_CLIENT_ID=<dev-client-id>
IGDB_CLIENT_SECRET=<dev-secret>
DATABASE_URL=<dev-postgres>
S3_BUCKET=<dev-bucket>
```

### Coverage

- Target: ≥80% on branches, functions, lines
- CI enforcement on PR

---

## 5. Key Files to Create

| File | Purpose |
|------|---------|
| `lambdas-py/pyproject.toml` | Project configuration (uv) |
| `lambdas-py/src/lambdas/config.py` | Environment settings (Pydantic) |
| `lambdas-py/src/lambdas/clients/s3.py` | S3 upload/download |
| `lambdas-py/src/lambdas/clients/igdb.py` | IGDB API with OAuth & rate limiting |
| `lambdas-py/src/lambdas/clients/steam.py` | Steam Web API client |
| `lambdas-py/src/lambdas/services/classifier.py` | Filter DLC/demos/tools |
| `lambdas-py/src/lambdas/services/database.py` | SQLAlchemy upsert operations |
| `lambdas-py/src/lambdas/handlers/steam_import.py` | Lambda 1: Steam → S3 |
| `lambdas-py/src/lambdas/handlers/igdb_enrichment.py` | Lambda 2: S3 → IGDB → S3 |
| `lambdas-py/src/lambdas/handlers/database_import.py` | Lambda 3: S3 → Database |
| `lambdas-py/src/lambdas/models/db.py` | SQLAlchemy models (mirror Prisma) |
| `savepoint-app/prisma/schema.prisma` | Add `igdbMatchStatus` enum to ImportedGame |
