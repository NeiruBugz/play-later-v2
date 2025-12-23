from __future__ import annotations

from functools import lru_cache

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    All settings are validated using Pydantic and loaded from environment variables.
    Sensitive values (API keys, secrets) are handled as SecretStr to prevent accidental logging.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Steam API Configuration
    steam_api_key: SecretStr = Field(
        ...,
        description="Steam Web API key for accessing user libraries",
    )

    # IGDB/Twitch API Configuration
    igdb_client_id: str = Field(
        ...,
        description="Twitch client ID for IGDB API access",
    )
    igdb_client_secret: SecretStr = Field(
        ...,
        description="Twitch client secret for IGDB API access",
    )

    # Database Configuration
    database_url: SecretStr = Field(
        ...,
        description="PostgreSQL connection string",
    )

    # AWS S3 Configuration
    s3_bucket: str = Field(
        ...,
        description="S3 bucket name for intermediate CSV storage",
    )
    aws_region: str = Field(
        default="us-east-1",
        description="AWS region for S3 and Lambda operations",
    )

    # Logging Configuration
    log_level: str = Field(
        default="INFO",
        description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)",
    )

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate that log level is one of the standard Python logging levels."""
        valid_levels = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        upper_v = v.upper()
        if upper_v not in valid_levels:
            raise ValueError(
                f"Invalid log level: {v}. Must be one of {', '.join(valid_levels)}"
            )
        return upper_v

    @field_validator("database_url", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate that database URL is a PostgreSQL connection string."""
        if not v.startswith(("postgresql://", "postgresql+asyncpg://")):
            raise ValueError(
                "Database URL must be a PostgreSQL connection string "
                "(postgresql:// or postgresql+asyncpg://)"
            )
        return v


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings.

    Returns:
        Cached Settings instance loaded from environment variables.

    Note:
        This function is cached to avoid re-reading environment variables
        on every call. The cache is cleared when the process restarts.
    """
    return Settings()
