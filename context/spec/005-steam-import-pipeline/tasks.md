# Tasks: Steam Library Import Pipeline

> **Spec:** `context/spec/005-steam-import-pipeline/`
> **Generated:** 2025-01-XX
> **Status:** Ready for implementation

---

## Phase 1: Foundation

- [x] **Slice 1: Project Scaffolding & Configuration**
  - [x] Create `lambdas-py/` directory structure as specified in technical-considerations.md **[Agent: python-expert]**
  - [x] Create `pyproject.toml` with uv configuration and all dependencies **[Agent: python-expert]**
  - [x] Create `.python-version` file (Python 3.12) **[Agent: python-expert]**
  - [x] Create `src/lambdas/config.py` with Pydantic Settings for all environment variables **[Agent: python-expert]**
  - [x] Create `src/lambdas/logging.py` with structlog configuration **[Agent: python-expert]**
  - [x] Create `src/lambdas/errors.py` with custom exception classes **[Agent: python-expert]**
  - [x] Create a minimal "hello world" Lambda handler to verify project runs **[Agent: python-expert]**
  - [x] Create `tests/conftest.py` with pytest fixtures **[Agent: python-expert]**

---

## Phase 2: Lambda 1 - Steam Import (Steam → S3)

- [x] **Slice 2: Steam API Client**
  - [x] Create `src/lambdas/models/steam.py` with Pydantic models for Steam API responses (`SteamOwnedGame`, `SteamLibraryResponse`) **[Agent: python-expert]**
  - [x] Create `src/lambdas/clients/steam.py` with Steam Web API client (fetch owned games by Steam ID) **[Agent: python-expert]**
  - [x] Add retry logic with `tenacity` for Steam API calls **[Agent: python-expert]**
  - [x] Write unit tests for Steam client with mocked HTTP responses **[Agent: python-expert]**

- [x] **Slice 3: S3 Client & CSV Operations**
  - [x] Create `src/lambdas/clients/s3.py` with upload/download functions **[Agent: python-expert]**
  - [x] Implement CSV generation from Steam game list **[Agent: python-expert]**
  - [x] Write unit tests for S3 client using `moto` **[Agent: python-expert]**

- [x] **Slice 4: Lambda 1 Handler (steam_import)**
  - [x] Create `src/lambdas/handlers/steam_import.py` with `SteamImportEvent` and `SteamImportResponse` models **[Agent: python-expert]**
  - [x] Implement handler: fetch Steam library → generate CSV → upload to S3 **[Agent: python-expert]**
  - [x] Write unit tests for handler with mocked Steam client and S3 client **[Agent: python-expert]**

---

## Phase 3: Lambda 2 - IGDB Enrichment (S3 → IGDB → S3)

- [x] **Slice 5: Steam App Classifier**
  - [x] Create `src/lambdas/services/classifier.py` with classification rules (DLC, demos, multiplayer components, tools, etc.) **[Agent: python-expert]**
  - [x] Implement `classify_steam_app()` function returning classification enum **[Agent: python-expert]**
  - [x] Write unit tests for all classification patterns from technical-considerations.md **[Agent: python-expert]**

- [x] **Slice 6: IGDB API Client**
  - [x] Create `src/lambdas/models/igdb.py` with Pydantic models for IGDB responses (`IgdbGame`, `IgdbExternalGame`, etc.) **[Agent: python-expert]**
  - [x] Create `src/lambdas/clients/igdb.py` with OAuth2 token management (Twitch API) **[Agent: python-expert]**
  - [x] Implement rate limiting (4 req/sec via `asyncio.Semaphore`) **[Agent: python-expert]**
  - [x] Implement in-memory cache (1-hour TTL, positive + negative caching) **[Agent: python-expert]**
  - [x] Implement `get_game_by_steam_app_id()` method using external game ID lookup **[Agent: python-expert]**
  - [x] Add retry with exponential backoff using `tenacity` **[Agent: python-expert]**
  - [x] Write unit tests for IGDB client with mocked HTTP responses **[Agent: python-expert]**

- [x] **Slice 7: Lambda 2 Handler (igdb_enrichment)**
  - [x] Create `src/lambdas/handlers/igdb_enrichment.py` with `IgdbEnrichmentEvent`, `IgdbEnrichmentResponse`, and `EnrichmentStats` models **[Agent: python-expert]**
  - [x] Implement handler: download CSV → classify apps → enrich games with IGDB → upload enriched CSV **[Agent: python-expert]**
  - [x] Track statistics (processed, matched, unmatched, filtered) **[Agent: python-expert]**
  - [x] Write unit tests for handler with mocked S3 and IGDB clients **[Agent: python-expert]**

---

## Phase 4: Lambda 3 - Database Import (S3 → PostgreSQL)

- [ ] **Slice 8: Prisma Schema Changes**
  - [ ] Add `IgdbMatchStatus` enum (`PENDING`, `MATCHED`, `UNMATCHED`, `IGNORED`) to Prisma schema **[Agent: nextjs-backend-expert]**
  - [ ] Add `igdbMatchStatus` field to `ImportedGame` model with default `PENDING` **[Agent: nextjs-backend-expert]**
  - [ ] Create and apply Prisma migration **[Agent: nextjs-backend-expert]**
  - [ ] Verify migration works in development environment **[Agent: nextjs-backend-expert]**

- [ ] **Slice 9: SQLAlchemy Models**
  - [ ] Create `src/lambdas/models/db.py` with SQLAlchemy models mirroring Prisma schema **[Agent: python-expert]**
  - [ ] Define models: `ImportedGame`, `Game`, `LibraryItem`, `Genre`, `Platform`, `GameGenre`, `GamePlatform` **[Agent: python-expert]**
  - [ ] Ensure field types and constraints match Prisma exactly **[Agent: python-expert]**

- [ ] **Slice 10: Database Service**
  - [ ] Create `src/lambdas/services/database.py` with SQLAlchemy session management **[Agent: python-expert]**
  - [ ] Implement `upsert_imported_game()` - upsert by `storefrontGameId` + `userId` **[Agent: python-expert]**
  - [ ] Implement `upsert_game()` - upsert by `igdbId`, fallback by `steamAppId` **[Agent: python-expert]**
  - [ ] Implement `create_library_item()` - create with status based on playtime (0 → CURIOUS_ABOUT, >0 → EXPERIENCED) **[Agent: python-expert]**
  - [ ] Implement `upsert_genre()` and `upsert_platform()` **[Agent: python-expert]**
  - [ ] Write unit tests with mocked SQLAlchemy session **[Agent: python-expert]**

- [ ] **Slice 11: Lambda 3 Handler (database_import)**
  - [ ] Create `src/lambdas/handlers/database_import.py` with `DatabaseImportEvent`, `DatabaseImportResponse`, and `ImportStats` models **[Agent: python-expert]**
  - [ ] Implement handler: download enriched CSV → parse → upsert all records **[Agent: python-expert]**
  - [ ] Track statistics (imported_games created/updated, games created/updated, library_items created) **[Agent: python-expert]**
  - [ ] Handle unmatched games (flag for manual resolution) **[Agent: python-expert]**
  - [ ] Write unit tests for handler with mocked S3 and database service **[Agent: python-expert]**

---

## Phase 5: Integration & Validation

- [ ] **Slice 12: Integration Tests**
  - [ ] Create `.env.integration.example` with required test environment variables **[Agent: python-expert]**
  - [ ] Write integration test for Steam client with real API (small test Steam ID) **[Agent: python-expert]**
  - [ ] Write integration test for IGDB client with real API **[Agent: python-expert]**
  - [ ] Write integration test for database operations with real PostgreSQL **[Agent: python-expert]**
  - [ ] Write full pipeline integration test (Lambda 1 → Lambda 2 → Lambda 3) **[Agent: python-expert]**
  - [ ] Verify coverage meets ≥80% threshold **[Agent: python-expert]**
