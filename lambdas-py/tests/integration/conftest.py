"""Integration test fixtures and configuration.

This module provides fixtures for integration tests that use real external services
(Steam API, IGDB/Twitch API, PostgreSQL, S3). Tests should skip gracefully if
required credentials are not provided.
"""

from __future__ import annotations

import os
from collections.abc import AsyncGenerator, Generator
from contextlib import suppress
from pathlib import Path
from typing import TYPE_CHECKING, Any

import boto3
import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from lambdas.clients.igdb import IgdbClient
from lambdas.clients.s3 import S3Client
from lambdas.clients.steam import SteamClient
from lambdas.config import Settings, get_settings

if TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client as BotoS3Client


# Load .env.integration file at module import time
_env_file = Path(__file__).parent.parent.parent / ".env.integration"
if _env_file.exists():
    load_dotenv(_env_file)
    print(f"\n✓ Loaded integration test environment from: {_env_file}")
else:
    print(f"\n⚠ Integration test environment file not found: {_env_file}")
    print("  Tests will skip if required credentials are not set in environment.")


# =============================================================================
# Integration Test Markers and Skip Conditions
# =============================================================================


def pytest_configure(config: pytest.Config) -> None:
    """Register custom markers for integration tests."""
    config.addinivalue_line(
        "markers",
        "integration: Integration tests with real APIs and databases",
    )
    config.addinivalue_line(
        "markers",
        "slow: Slow tests that may take 30-60 seconds",
    )


@pytest.fixture(scope="session")
def integration_env_vars() -> dict[str, str | None]:
    """Load environment variables required for integration tests.

    Returns:
        Dictionary of environment variables needed for integration tests.
        Values are None if not set.
    """
    return {
        "TEST_USER_ID": os.getenv("TEST_USER_ID"),
        "TEST_STEAM_ID": os.getenv("TEST_STEAM_ID"),
        "STEAM_API_KEY": os.getenv("STEAM_API_KEY"),
        "IGDB_CLIENT_ID": os.getenv("IGDB_CLIENT_ID"),
        "IGDB_CLIENT_SECRET": os.getenv("IGDB_CLIENT_SECRET"),
        "DATABASE_URL": os.getenv("DATABASE_URL"),
        "S3_BUCKET": os.getenv("S3_BUCKET"),
        "AWS_REGION": os.getenv("AWS_REGION", "us-east-1"),
    }


@pytest.fixture(scope="session")
def skip_if_no_steam_credentials(integration_env_vars: dict[str, str | None]) -> None:
    """Skip test if Steam API credentials are not available.

    Args:
        integration_env_vars: Environment variables dict

    Raises:
        pytest.skip: If Steam credentials are missing
    """
    if not integration_env_vars.get("STEAM_API_KEY") or not integration_env_vars.get(
        "TEST_STEAM_ID"
    ):
        pytest.skip(
            "Steam API credentials not provided. "
            "Set STEAM_API_KEY and TEST_STEAM_ID in .env.integration"
        )


@pytest.fixture(scope="session")
def skip_if_no_igdb_credentials(integration_env_vars: dict[str, str | None]) -> None:
    """Skip test if IGDB/Twitch API credentials are not available.

    Args:
        integration_env_vars: Environment variables dict

    Raises:
        pytest.skip: If IGDB credentials are missing
    """
    if not integration_env_vars.get("IGDB_CLIENT_ID") or not integration_env_vars.get(
        "IGDB_CLIENT_SECRET"
    ):
        pytest.skip(
            "IGDB/Twitch API credentials not provided. "
            "Set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET in .env.integration"
        )


@pytest.fixture(scope="session")
def skip_if_no_database(integration_env_vars: dict[str, str | None]) -> None:
    """Skip test if database connection is not available.

    Args:
        integration_env_vars: Environment variables dict

    Raises:
        pytest.skip: If database URL is missing
    """
    if not integration_env_vars.get("DATABASE_URL"):
        pytest.skip(
            "Database URL not provided. Set DATABASE_URL in .env.integration"
        )


@pytest.fixture(scope="session")
def skip_if_no_s3(integration_env_vars: dict[str, str | None]) -> None:
    """Skip test if S3 configuration is not available.

    Args:
        integration_env_vars: Environment variables dict

    Raises:
        pytest.skip: If S3 bucket is missing
    """
    if not integration_env_vars.get("S3_BUCKET"):
        pytest.skip("S3 bucket not provided. Set S3_BUCKET in .env.integration")


# =============================================================================
# Settings and Configuration
# =============================================================================


@pytest.fixture(scope="session")
def integration_settings() -> Settings:
    """Provide Settings instance for integration tests.

    Returns:
        Settings loaded from environment variables.
    """
    return get_settings()


# =============================================================================
# Steam Client Fixtures
# =============================================================================


@pytest.fixture
async def steam_client(
    integration_settings: Settings,
    skip_if_no_steam_credentials: None,
) -> AsyncGenerator[SteamClient, None]:
    """Provide a real Steam API client for integration tests.

    Args:
        integration_settings: Application settings
        skip_if_no_steam_credentials: Skip condition fixture

    Yields:
        Initialized SteamClient connected to real Steam API
    """
    async with SteamClient(api_key=integration_settings.steam_api_key) as client:
        yield client


@pytest.fixture(scope="session")
def test_steam_id(integration_env_vars: dict[str, str | None]) -> str:
    """Provide test Steam ID for integration tests.

    Args:
        integration_env_vars: Environment variables dict

    Returns:
        Steam ID 64 from environment

    Raises:
        ValueError: If TEST_STEAM_ID is not set
    """
    steam_id = integration_env_vars.get("TEST_STEAM_ID")
    if not steam_id:
        raise ValueError("TEST_STEAM_ID not set in environment")
    return steam_id


# =============================================================================
# IGDB Client Fixtures
# =============================================================================


@pytest.fixture
async def igdb_client(
    integration_settings: Settings,
    skip_if_no_igdb_credentials: None,
) -> AsyncGenerator[IgdbClient, None]:
    """Provide a real IGDB API client for integration tests.

    Args:
        integration_settings: Application settings
        skip_if_no_igdb_credentials: Skip condition fixture

    Yields:
        Initialized IgdbClient connected to real IGDB API
    """
    async with IgdbClient(
        client_id=integration_settings.igdb_client_id,
        client_secret=integration_settings.igdb_client_secret,
    ) as client:
        yield client


# =============================================================================
# Database Fixtures
# =============================================================================


@pytest.fixture(scope="session")
def db_engine(
    integration_settings: Settings,
    skip_if_no_database: None,
) -> Generator[Any, None, None]:
    """Provide a SQLAlchemy engine connected to real database.

    Args:
        integration_settings: Application settings
        skip_if_no_database: Skip condition fixture

    Yields:
        SQLAlchemy Engine instance
    """
    engine = create_engine(
        integration_settings.database_url,
        echo=False,
        pool_pre_ping=True,
    )

    # Verify connection works
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        pytest.fail(f"Failed to connect to database: {e}")

    yield engine
    engine.dispose()


@pytest.fixture
def db_session(db_engine: Any) -> Generator[Session, None, None]:
    """Provide a database session with automatic rollback.

    Args:
        db_engine: SQLAlchemy engine fixture

    Yields:
        Database session that will be rolled back after test
    """
    SessionLocal = sessionmaker(bind=db_engine)
    session = SessionLocal()

    try:
        yield session
        session.rollback()  # Rollback any changes made during test
    finally:
        session.close()


@pytest.fixture(scope="session")
def test_user_id(integration_env_vars: dict[str, str | None]) -> str:
    """Provide test user ID for database operations.

    Args:
        integration_env_vars: Environment variables dict

    Returns:
        Test user ID from environment

    Raises:
        ValueError: If TEST_USER_ID is not set
    """
    user_id = integration_env_vars.get("TEST_USER_ID")
    if not user_id:
        raise ValueError("TEST_USER_ID not set in environment")
    return user_id


# =============================================================================
# S3 Client Fixtures
# =============================================================================


@pytest.fixture
def real_s3_client(
    integration_settings: Settings,
    skip_if_no_s3: None,
) -> Generator[BotoS3Client, None, None]:
    """Provide a real boto3 S3 client for integration tests.

    Args:
        integration_settings: Application settings
        skip_if_no_s3: Skip condition fixture

    Yields:
        Boto3 S3 client connected to real S3 (or LocalStack)
    """
    # Support LocalStack for local development
    endpoint_url = os.getenv("AWS_ENDPOINT_URL")

    client = boto3.client(
        "s3",
        region_name=integration_settings.aws_region,
        endpoint_url=endpoint_url,
    )

    # Verify bucket exists or create it
    try:
        client.head_bucket(Bucket=integration_settings.s3_bucket)
    except client.exceptions.NoSuchBucket:
        # Create bucket if it doesn't exist (useful for LocalStack)
        client.create_bucket(
            Bucket=integration_settings.s3_bucket,
            CreateBucketConfiguration={"LocationConstraint": integration_settings.aws_region}
            if integration_settings.aws_region != "us-east-1"
            else {},
        )

    yield client


@pytest.fixture
async def s3_client_wrapper(
    integration_settings: Settings,
    skip_if_no_s3: None,
) -> AsyncGenerator[S3Client, None]:
    """Provide S3Client wrapper for integration tests.

    Args:
        integration_settings: Application settings
        skip_if_no_s3: Skip condition fixture

    Yields:
        Initialized S3Client wrapper
    """
    endpoint_url = os.getenv("AWS_ENDPOINT_URL")

    async with S3Client(
        bucket_name=integration_settings.s3_bucket,
        region_name=integration_settings.aws_region,
        endpoint_url=endpoint_url,
    ) as client:
        yield client


# =============================================================================
# Test Data Cleanup Fixtures
# =============================================================================


@pytest.fixture
def cleanup_s3_test_files(
    real_s3_client: BotoS3Client,
    integration_settings: Settings,
) -> Generator[list[str], None, None]:
    """Track and cleanup S3 files created during tests.

    Args:
        real_s3_client: Real S3 client fixture
        integration_settings: Application settings

    Yields:
        List to track S3 keys for cleanup
    """
    s3_keys: list[str] = []

    yield s3_keys

    # Cleanup: Delete all tracked S3 files
    for key in s3_keys:
        with suppress(Exception):
            real_s3_client.delete_object(
                Bucket=integration_settings.s3_bucket,
                Key=key,
            )


@pytest.fixture
def cleanup_db_test_data(
    db_session: Session,
    test_user_id: str,
) -> Generator[None, None, None]:
    """Cleanup database test data after test completes.

    Args:
        db_session: Database session fixture
        test_user_id: Test user ID

    Yields:
        None (cleanup happens after test)
    """
    yield

    # Cleanup: Delete test data in correct order (respecting foreign keys)
    try:
        # Delete LibraryItems first (has foreign keys to ImportedGame and User)
        db_session.execute(
            text("DELETE FROM library_items WHERE user_id = :user_id"),
            {"user_id": test_user_id},
        )

        # Delete ImportedGames for test user
        db_session.execute(
            text("DELETE FROM imported_games WHERE user_id = :user_id"),
            {"user_id": test_user_id},
        )

        db_session.commit()
    except Exception:
        db_session.rollback()
        # Best effort cleanup - don't fail test if cleanup fails
