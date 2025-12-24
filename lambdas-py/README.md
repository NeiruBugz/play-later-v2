# Steam Library Import Pipeline - AWS Lambda Functions

Python-based AWS Lambda functions for importing and enriching Steam game libraries.

## Project Structure

```
lambdas-py/
├── pyproject.toml           # uv configuration and dependencies
├── .python-version          # Python 3.12
├── src/
│   └── lambdas/
│       ├── config.py        # Pydantic Settings
│       ├── logging.py       # structlog configuration
│       ├── errors.py        # Custom exceptions
│       ├── clients/         # External API clients (S3, Steam, IGDB)
│       ├── services/        # Business logic services
│       ├── handlers/        # Lambda entry points
│       └── models/          # Pydantic and SQLAlchemy models
└── tests/
    ├── conftest.py          # Pytest fixtures
    ├── unit/                # Unit tests
    └── integration/         # Integration tests
```

## Setup

### Prerequisites

- Python 3.12+
- [uv](https://github.com/astral-sh/uv) package manager

### Installation

```bash
# Install dependencies (uses uv.lock for reproducible builds)
uv sync

# Install with dev dependencies
uv sync --all-extras
```

### Dependency Management

This project uses **reproducible dependency management** with explicit version constraints:

- **Upper bounds** on all dependencies to prevent breaking changes
- **Lock file** (`uv.lock`) committed to version control for reproducible builds
- **CI/CD builds** must use `uv sync --frozen` to ensure exact versions from lock file

**Key version constraints:**
- `httpx<0.28` - Avoids breaking changes in 0.28.1 (removed deprecated shortcuts, SSL API changes)
- `boto3<2.0` - Prevents S3 integrity protection regressions and botocore mismatches
- `pydantic-settings<3.0` - Avoids source resolution order changes (2.12.0) and env_prefix behavior changes
- `sqlalchemy<3.0` - Prevents breaking changes in transaction/ORM execution model
- `psycopg2-binary<3.0` - Avoids binary wheel compatibility issues with newer libpq/OpenSSL

**For Lambda container builds:**
```bash
# Always use frozen lock file for reproducible builds
uv sync --frozen

# Or explicitly use lock file
uv sync --locked
```

## Development

### Running Tests

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov

# Run only unit tests
uv run pytest -m unit

# Run only integration tests
uv run pytest -m integration
```

### Code Quality

```bash
# Linting
uv run ruff check src/

# Auto-fix linting issues
uv run ruff check --fix src/

# Type checking
uv run mypy src/
```

### Environment Variables

Create a `.env` file in the project root (see `.env.example` for template):

```bash
# Steam API Configuration
STEAM_API_KEY=your_steam_api_key

# IGDB/Twitch API Configuration
IGDB_CLIENT_ID=your_igdb_client_id
IGDB_CLIENT_SECRET=your_igdb_client_secret

# Database Configuration
DATABASE_URL=postgresql://user:pass@host:5432/db

# AWS S3 Configuration
S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# Logging Configuration
LOG_LEVEL=INFO
```

## Lambda Functions

### 1. Steam Import (`steam_import`)

Fetches a user's Steam library and uploads raw data to S3 as CSV.

**Input:** `{ "steam_id": "76561198..." }`
**Output:** `{ "s3_key": "raw/steam-library-{steam_id}-{timestamp}.csv" }`

### 2. IGDB Enrichment (`igdb_enrichment`)

Downloads raw Steam CSV, classifies apps, enriches with IGDB data, uploads enriched CSV.

**Input:** `{ "s3_key": "raw/steam-library-..." }`
**Output:** `{ "s3_key": "enriched/steam-library-...-enriched.csv" }`

### 3. Database Import (`database_import`)

Downloads enriched CSV and upserts data to PostgreSQL.

**Input:** `{ "s3_key": "enriched/steam-library-...-enriched.csv" }`
**Output:** `{ "imported_count": 42, "skipped_count": 3 }`

## Architecture

### Service Layer Pattern

- **Handlers:** Lambda entry points with event parsing
- **Services:** Business logic (classifier, database operations)
- **Clients:** External API wrappers (S3, Steam, IGDB)
- **Models:** Pydantic models for validation, SQLAlchemy for database

### Error Handling

All custom exceptions inherit from `LambdaError` with structured error codes:

- `SteamApiError` - Steam Web API failures
- `IgdbApiError` - IGDB API failures
- `S3Error` - S3 operation failures
- `DatabaseError` - Database operation failures
- `ValidationError` - Input validation failures

### Logging

Uses `structlog` for structured logging:

- **Development:** Colored console output
- **Production:** JSON logs for CloudWatch

```python
from lambdas.logging import get_logger

logger = get_logger(lambda_name="steam_import", user_id="12345")
logger.info("Processing started", steam_id="76561198...")
```

## Testing Strategy

### Unit Tests

- Mocked external dependencies (S3, APIs, database)
- Fast execution
- Run with `pytest -m unit`

### Integration Tests

- Real AWS services (using moto for S3)
- Database transactions
- Run with `pytest -m integration`

## Deployment

### Infrastructure Setup

Deploy infrastructure with Terraform:

```bash
cd infra/envs/dev  # or infra/envs/prod
terraform init
terraform apply
```

### Populate Secrets

After `terraform apply`, populate the AWS Secrets Manager secrets via AWS CLI.
This keeps sensitive values out of Terraform state.

```bash
# Set environment (dev or prod)
ENV=dev  # or prod
PROJECT=savepoint

# Steam API Key
aws secretsmanager put-secret-value \
  --secret-id "${PROJECT}/${ENV}/steam-api-key" \
  --secret-string "$STEAM_API_KEY"

# IGDB Credentials (JSON format)
aws secretsmanager put-secret-value \
  --secret-id "${PROJECT}/${ENV}/igdb-credentials" \
  --secret-string "{\"client_id\":\"$IGDB_CLIENT_ID\",\"client_secret\":\"$IGDB_CLIENT_SECRET\"}"

# Database URL
aws secretsmanager put-secret-value \
  --secret-id "${PROJECT}/${ENV}/database-url" \
  --secret-string "$DATABASE_URL"
```

### Build and Push Container Images

**Important:** Docker builds must use the lock file (`uv.lock`) for reproducible Lambda deployments.

```bash
# Authenticate with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ECR_URL>

# Build and push images (example for steam-import)
# Ensure Dockerfile uses: uv sync --frozen or uv sync --locked
docker build -t savepoint-lambdas:steam-import -f Dockerfile.steam-import .
docker tag savepoint-lambdas:steam-import <ECR_URL>:steam-import-latest
docker push <ECR_URL>:steam-import-latest
```

**Dockerfile requirements:**
- Must copy `uv.lock` before running `uv sync`
- Use `uv sync --frozen` or `uv sync --locked` to enforce exact versions
- Example:
  ```dockerfile
  COPY pyproject.toml uv.lock ./
  RUN uv sync --frozen --no-dev
  ```

## License

MIT
