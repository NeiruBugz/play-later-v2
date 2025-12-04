from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, Field, field_validator

from lambdas.clients.s3 import S3Client
from lambdas.clients.steam import SteamClient
from lambdas.config import get_settings
from lambdas.errors import S3Error, SteamApiError
from lambdas.logging import bind_context, get_logger

if TYPE_CHECKING:
    pass


class SteamImportEvent(BaseModel):
    """Input event for the steam_import Lambda."""

    user_id: str = Field(..., min_length=1, description="The SavePoint user ID")
    steam_id64: str = Field(..., description="The user's 64-bit Steam ID")

    @field_validator("steam_id64")
    @classmethod
    def validate_steam_id(cls, v: str) -> str:
        """Validate Steam ID format (17 digits)."""
        if not v.isdigit() or len(v) != 17:
            raise ValueError("Steam ID must be exactly 17 digits")
        return v


class SteamImportResponse(BaseModel):
    """Response from the steam_import Lambda."""

    success: bool
    s3_location: str | None = None
    game_count: int | None = None
    error: str | None = None


async def _import_steam_library(event: SteamImportEvent) -> SteamImportResponse:
    """Internal async implementation of the Steam import logic.

    Args:
        event: Validated import event

    Returns:
        Import response with S3 location and game count
    """
    logger = get_logger()
    settings = get_settings()

    # Bind context for structured logging
    bind_context(user_id=event.user_id, steam_id64=event.steam_id64)

    logger.info("Starting Steam library import")

    try:
        # Fetch games from Steam
        async with SteamClient(api_key=settings.steam_api_key) as steam_client:
            games = await steam_client.get_owned_games(event.steam_id64)

        logger.info("Fetched games from Steam", game_count=len(games))

        if not games:
            logger.warning("No games found in Steam library")
            return SteamImportResponse(
                success=True,
                s3_location=None,
                game_count=0,
            )

        # Upload to S3
        s3_client = S3Client(bucket=settings.s3_bucket, region=settings.aws_region)
        s3_key = s3_client.upload_games(user_id=event.user_id, games=games)

        logger.info("Uploaded games to S3", s3_key=s3_key, game_count=len(games))

        return SteamImportResponse(
            success=True,
            s3_location=s3_key,
            game_count=len(games),
        )

    except SteamApiError as e:
        logger.error("Steam API error", error=str(e), error_code=e.code)
        return SteamImportResponse(success=False, error=f"Steam API error: {e.message}")

    except S3Error as e:
        logger.error("S3 error", error=str(e), error_code=e.code)
        return SteamImportResponse(success=False, error=f"S3 error: {e.message}")


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    """AWS Lambda handler for Steam library import.

    This is the entry point for Lambda invocation.

    Args:
        event: Lambda event containing user_id and steam_id64
        _context: Lambda context (unused)

    Returns:
        Response dict with success status, S3 location, and game count
    """
    logger = get_logger()

    try:
        # Validate input
        try:
            validated_event = SteamImportEvent(**event)
        except Exception as e:
            logger.error("Invalid event", error=str(e))
            return SteamImportResponse(
                success=False, error=f"Invalid input: {e}"
            ).model_dump()

        # Run async import
        response = asyncio.run(_import_steam_library(validated_event))
        return response.model_dump()

    except Exception as e:
        logger.exception("Unexpected error in steam_import handler")
        return SteamImportResponse(
            success=False, error=f"Unexpected error: {e}"
        ).model_dump()
