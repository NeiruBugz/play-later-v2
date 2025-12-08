# Integration Tests for Steam Library Import Pipeline

Comprehensive integration tests for validating the three-Lambda pipeline with real external services.

## Overview

These tests make **REAL API calls** to:
- ✅ Steam Web API (fetch game library)
- ✅ IGDB/Twitch API (game enrichment)
- ✅ PostgreSQL database (data persistence)
- ✅ S3 or LocalStack (file storage)

**Important**: Tests require valid credentials and will consume API quota. Use a **small test Steam account** (10-50 games recommended) for faster execution.

## Test Files

| File | Purpose | Duration | API Calls |
|------|---------|----------|-----------|
| `test_steam_client_integration.py` | Steam API client validation | ~10s | Steam API |
| `test_igdb_client_integration.py` | IGDB API client validation | ~15s | IGDB/Twitch |
| `test_database_integration.py` | Database CRUD operations | ~10s | PostgreSQL |
| `test_full_pipeline_integration.py` | End-to-end pipeline (Lambda 1→2→3) | 30-60s | All services |

## Setup

### 1. Install Dependencies

```bash
cd lambdas-py
uv sync --all-extras
```

### 2. Configure Environment

Copy the example file and fill in your credentials:

```bash
cp .env.integration.example .env.integration
```

**Required Environment Variables:**

```bash
# Test User (create in your dev database first)
TEST_USER_ID=test-user-integration

# Steam API (get from https://steamcommunity.com/dev/apikey)
STEAM_API_KEY=your_steam_api_key_here
TEST_STEAM_ID=76561198000000000  # Use small test account!

# IGDB/Twitch API (get from https://dev.twitch.tv/console/apps)
IGDB_CLIENT_ID=your_twitch_client_id_here
IGDB_CLIENT_SECRET=your_twitch_client_secret_here

# Database (dev/test database only - NOT production!)
DATABASE_URL=postgresql://user:password@localhost:5432/savepoint_test

# S3 (test bucket or LocalStack)
S3_BUCKET=savepoint-steam-imports-test
AWS_REGION=us-east-1
```

### 3. Set Up Test Database

Create a test user in your development database:

```sql
INSERT INTO "User" (id, email, name)
VALUES ('test-user-integration', 'test@example.com', 'Test User');
```

### 4. Set Up S3

**Option A: LocalStack (recommended for local development)**

```bash
# Start LocalStack
docker-compose up -d localstack

# Add to .env.integration
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

**Option B: Real AWS S3**

- Create a dedicated test bucket
- Configure AWS credentials (IAM role or access keys)
- Ensure bucket exists in specified region

## Running Tests

### Run All Integration Tests

```bash
uv run pytest -m integration
```

### Run Specific Test File

```bash
uv run pytest tests/integration/test_steam_client_integration.py
```

### Run Without Slow Tests

```bash
uv run pytest -m "integration and not slow"
```

### Run With Verbose Output

```bash
uv run pytest -m integration -v -s
```

### Run Only Full Pipeline Test

```bash
uv run pytest -m slow
```

## Test Behavior

### Automatic Skipping

Tests skip gracefully if credentials are missing:

```
SKIPPED [1] Missing Steam API credentials
SKIPPED [1] Missing IGDB/Twitch credentials
SKIPPED [1] Missing database URL
```

**To fix**: Add missing variables to `.env.integration`

### Cleanup

Tests automatically clean up after themselves:

- ✅ **S3 files**: Deleted in `cleanup_s3_test_files` fixture
- ✅ **Database records**: Deleted in `cleanup_db_test_data` fixture
- ✅ **Best effort**: Cleanup happens even if test fails

### Expected Results

**Successful test run:**

```
tests/integration/test_steam_client_integration.py::test_fetch_owned_games_success PASSED
tests/integration/test_igdb_client_integration.py::test_oauth_token_acquisition PASSED
tests/integration/test_database_integration.py::test_upsert_imported_game_create PASSED
tests/integration/test_full_pipeline_integration.py::test_full_pipeline_steam_to_database PASSED

========== 4 passed in 45.2s ==========
```

## Test Coverage

Integration tests validate:

### Steam Client Tests
- ✅ Fetch owned games from real Steam API
- ✅ Validate response structure (SteamOwnedGame model)
- ✅ Handle invalid Steam ID formats
- ✅ Handle private/non-existent profiles
- ✅ Verify playtime data consistency
- ✅ Test async context manager

### IGDB Client Tests
- ✅ OAuth2 token acquisition from Twitch
- ✅ Search games by Steam App ID
- ✅ Cache behavior (positive and negative)
- ✅ Rate limiting (4 req/sec max)
- ✅ Multiple concurrent requests
- ✅ Game metadata completeness
- ✅ Invalid credentials handling

### Database Tests
- ✅ ImportedGame upsert (create and update)
- ✅ Game upsert with genres and platforms
- ✅ LibraryItem creation with status logic
- ✅ Playtime-based status (0 = CURIOUS_ABOUT, >0 = EXPERIENCED)
- ✅ Full import workflow (ImportedGame → Game → LibraryItem)
- ✅ Transaction rollback

### Full Pipeline Tests
- ✅ Lambda 1: Steam API → CSV → S3
- ✅ Lambda 2: CSV → IGDB enrichment → enriched CSV → S3
- ✅ Lambda 3: enriched CSV → database import
- ✅ End-to-end data flow validation
- ✅ Database record verification
- ✅ Error handling (empty library, invalid input)

## Troubleshooting

### Tests Skip with "Missing environment variables"

**Problem**: Required credentials not set

**Solution**:
```bash
# Verify .env.integration exists
ls -la .env.integration

# Check all required variables are set
cat .env.integration | grep -E "TEST_USER_ID|STEAM_API_KEY|TEST_STEAM_ID|IGDB_CLIENT_ID"
```

### "Invalid Steam ID format" Error

**Problem**: TEST_STEAM_ID is not exactly 17 digits

**Solution**:
```bash
# Get your Steam ID from https://steamid.io/
# Should be 17-digit number like: 76561198026626729
TEST_STEAM_ID=76561198026626729
```

### "No games found in Steam library"

**Problem**: Steam profile is set to private

**Solution**:
1. Go to Steam → Settings → Privacy
2. Set "Game details" to **Public**
3. Wait a few minutes for Steam API to update

### "IGDB authentication failed"

**Problem**: Invalid IGDB/Twitch credentials

**Solution**:
```bash
# Verify credentials at https://dev.twitch.tv/console/apps
# Ensure application is active
# Client ID should look like: abc123def456
# Client Secret should look like: xyz789uvw012
```

### "Database connection failed"

**Problem**: Database not accessible or test user doesn't exist

**Solution**:
```bash
# Test database connection
psql "postgresql://user:password@localhost:5432/savepoint_test" -c "SELECT 1"

# Create test user if missing
psql "postgresql://user:password@localhost:5432/savepoint_test" -c \
  "INSERT INTO \"User\" (id, email, name) VALUES ('test-user-integration', 'test@example.com', 'Test User') ON CONFLICT DO NOTHING"
```

### "S3 bucket not found"

**Problem**: S3 bucket doesn't exist

**Solution (LocalStack)**:
```bash
# Ensure LocalStack is running
docker-compose ps localstack

# Create bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://savepoint-steam-imports-test
```

**Solution (AWS)**:
```bash
# Create bucket in AWS
aws s3 mb s3://savepoint-steam-imports-test --region us-east-1
```

### Tests are Very Slow (>5 minutes)

**Problem**: Large Steam library (100+ games)

**Solution**:
- Use a smaller test account (10-50 games recommended)
- Steam libraries with 200+ games can take 10+ minutes for full pipeline test
- Consider using `--maxfail=1` to stop on first failure

### "Rate limit exceeded" Errors

**Problem**: Too many API requests in short time

**Solution**:
- **Steam API**: Wait a few minutes before retrying
- **IGDB API**: Built-in rate limiting (4 req/sec) should prevent this
- If persistent, check for other processes using same API keys

## Performance Benchmarks

**Expected durations** (10-50 game library):

| Test | Duration | API Calls |
|------|----------|-----------|
| Steam Client Tests | 8-12s | 5-10 Steam API calls |
| IGDB Client Tests | 10-15s | 8-12 IGDB API calls |
| Database Tests | 5-10s | 0 external API calls |
| Full Pipeline Test | 30-60s | All services (Steam + IGDB + DB) |

**Large library** (100+ games):
- Full pipeline: 2-5 minutes
- IGDB enrichment dominates (4 req/sec limit)

## Best Practices

1. **Use Small Test Account**: 10-50 games for fast testing
2. **Run Sparingly**: Integration tests consume API quota
3. **Use Unit Tests During Development**: Integration tests for final validation
4. **Check Credentials**: Verify `.env.integration` before running
5. **Monitor Output**: Use `-s` flag to see detailed progress
6. **Clean Up**: Tests auto-cleanup, but verify if interrupted

## CI/CD Integration

Integration tests can run in CI with stored secrets:

```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      localstack:
        image: localstack/localstack

    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
        with:
          version: "0.5.0"
      - run: uv sync --all-extras
      - run: uv run pytest -m integration
        env:
          STEAM_API_KEY: ${{ secrets.STEAM_API_KEY }}
          TEST_STEAM_ID: ${{ secrets.TEST_STEAM_ID }}
          IGDB_CLIENT_ID: ${{ secrets.IGDB_CLIENT_ID }}
          IGDB_CLIENT_SECRET: ${{ secrets.IGDB_CLIENT_SECRET }}
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
          S3_BUCKET: test-bucket
          AWS_ENDPOINT_URL: http://localhost:4566
```

## Security

⚠️  **Never commit `.env.integration` with real credentials to git!**

`.env.integration` is in `.gitignore` - keep it there!

## Coverage Requirements

Integration tests contribute to overall coverage but are not required to meet the ≥80% threshold. They validate **runtime behavior** rather than code coverage.

## Support

If tests fail consistently:

1. Check all troubleshooting steps above
2. Verify credentials are valid and active
3. Test each service independently (Steam, IGDB, DB, S3)
4. Check service status (Steam API, Twitch API may have outages)
5. Review logs for detailed error messages

---

Last updated: 2025-12-05
