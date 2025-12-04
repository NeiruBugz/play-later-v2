from __future__ import annotations

from collections.abc import Generator
from typing import Any
from unittest.mock import MagicMock

import pytest
import structlog
from moto import mock_aws

from lambdas.config import Settings, get_settings


@pytest.fixture(autouse=True)
def _clear_settings_cache() -> Generator[None, None, None]:
    """Clear the lru_cache on get_settings before each test.

    This ensures each test gets a fresh Settings instance and can override
    environment variables without affecting other tests.
    """
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def mock_env_vars() -> dict[str, str]:
    """Provide default mock environment variables for testing.

    Returns:
        Dictionary of environment variables with test values.
    """
    return {
        "STEAM_API_KEY": "test_steam_key",
        "IGDB_CLIENT_ID": "test_igdb_client_id",
        "IGDB_CLIENT_SECRET": "test_igdb_client_secret",
        "DATABASE_URL": "postgresql://test:test@localhost:5432/test_db",
        "S3_BUCKET": "test-bucket",
        "AWS_REGION": "us-east-1",
        "LOG_LEVEL": "DEBUG",
    }


@pytest.fixture
def settings(mock_env_vars: dict[str, str], monkeypatch: pytest.MonkeyPatch) -> Settings:
    """Provide a Settings instance with mocked environment variables.

    Args:
        mock_env_vars: Dictionary of environment variables
        monkeypatch: pytest monkeypatch fixture

    Returns:
        Settings instance loaded from mocked environment
    """
    for key, value in mock_env_vars.items():
        monkeypatch.setenv(key, value)

    return get_settings()


@pytest.fixture
def mock_logger() -> structlog.BoundLogger:
    """Provide a mock structlog logger for testing.

    Returns:
        Mock BoundLogger that discards all log messages.
    """
    # Create a logger that uses a mock processor
    mock_processor = MagicMock()
    structlog.configure(
        processors=[mock_processor],
        wrapper_class=structlog.BoundLogger,
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=False,
    )
    return structlog.get_logger()


@pytest.fixture
def aws_credentials(monkeypatch: pytest.MonkeyPatch) -> None:
    """Set up fake AWS credentials for moto.

    Args:
        monkeypatch: pytest monkeypatch fixture

    Note:
        These are dummy credentials required by boto3 but not validated by moto.
    """
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SECURITY_TOKEN", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")


@pytest.fixture
def s3_client(aws_credentials: None) -> Generator[Any, None, None]:
    """Provide a mocked S3 client using moto.

    Args:
        aws_credentials: Fixture that sets up AWS credentials

    Yields:
        Mocked boto3 S3 client

    Note:
        The mock is automatically cleaned up after the test.
    """
    with mock_aws():
        import boto3

        yield boto3.client("s3", region_name="us-east-1")


@pytest.fixture
def lambda_context() -> MagicMock:
    """Provide a mock Lambda context object.

    Returns:
        Mock context with common Lambda context attributes.
    """
    context = MagicMock()
    context.function_name = "test-function"
    context.function_version = "$LATEST"
    context.invoked_function_arn = (
        "arn:aws:lambda:us-east-1:123456789012:function:test-function"
    )
    context.memory_limit_in_mb = 128
    context.request_id = "test-request-id-12345"
    context.log_group_name = "/aws/lambda/test-function"
    context.log_stream_name = "2024/01/01/[$LATEST]test-stream"
    return context
