"""Lambda 3: Import enriched Steam library data into PostgreSQL.

This Lambda handler is the final stage of the Steam import pipeline:
1. Downloads enriched CSV from S3 (output from Lambda 2)
2. Parses CSV rows into Pydantic models
3. Upserts data into PostgreSQL using database service
4. Creates LibraryItem records with playtime-based status
5. Tracks import statistics (created vs updated)

Import Logic:
- All games upsert ImportedGame (raw Steam data)
- MATCHED games upsert Game + create LibraryItem
- UNMATCHED games only upsert ImportedGame (manual review needed)
- Playtime = 0 → CURIOUS_ABOUT status
- Playtime > 0 → EXPERIENCED status

Architecture:
- Event/Response models with Pydantic validation
- CSV parsing with error handling for null/empty fields
- Database transactions with rollback on errors
- Statistics tracking for monitoring import progress
- Structured logging with context binding
"""

from __future__ import annotations

import csv
import io
from datetime import datetime
from typing import Any
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator

from lambdas.clients.s3 import S3Client
from lambdas.config import get_settings
from lambdas.errors import S3Error
from lambdas.logging import bind_context, get_logger
from lambdas.models.db import IgdbMatchStatus, Storefront
from lambdas.services.database import (
    GameData,
    GenreData,
    ImportedGameData,
    LibraryItemData,
    PlatformData,
    create_library_item,
    get_session,
    upsert_game,
    upsert_genre,
    upsert_imported_game,
    upsert_platform,
)


class DatabaseImportEvent(BaseModel):
    """Input event for the database_import Lambda.

    Attributes:
        user_id: SavePoint user ID
        s3_enriched_location: S3 URI to enriched CSV (s3://bucket/key)
    """

    user_id: str = Field(..., min_length=1, description="The SavePoint user ID")
    s3_enriched_location: str = Field(
        ...,
        description="S3 location of enriched CSV (s3://bucket/key format)",
    )

    @field_validator("s3_enriched_location")
    @classmethod
    def validate_s3_uri(cls, v: str) -> str:
        """Validate S3 URI format."""
        if not v.startswith("s3://"):
            raise ValueError("s3_enriched_location must start with 's3://'")

        parsed = urlparse(v)
        if not parsed.netloc or not parsed.path:
            raise ValueError("Invalid S3 URI: must contain bucket and key")

        return v


class ImportStats(BaseModel):
    """Statistics from database import operation.

    Attributes:
        imported_games_created: Number of new ImportedGame records
        imported_games_updated: Number of updated ImportedGame records
        games_created: Number of new Game records
        games_updated: Number of updated Game records
        library_items_created: Number of new LibraryItem records
    """

    imported_games_created: int = Field(default=0, ge=0)
    imported_games_updated: int = Field(default=0, ge=0)
    games_created: int = Field(default=0, ge=0)
    games_updated: int = Field(default=0, ge=0)
    library_items_created: int = Field(default=0, ge=0)


class DatabaseImportResponse(BaseModel):
    """Response from the database_import Lambda.

    Attributes:
        success: Whether import completed successfully
        stats: Import statistics (counts of created/updated records)
        error: Error message if import failed
    """

    success: bool
    stats: ImportStats | None = None
    error: str | None = None


class EnrichedCsvRow(BaseModel):
    """Parsed row from enriched CSV (Lambda 2 output).

    This model validates and parses a single row from the enriched CSV.
    Empty strings are converted to None for optional fields.

    Uses aliases to map CSV column names from igdb_enrichment handler to
    internal field names. CSV columns:
        appid -> steam_app_id
        playtime_forever -> playtime
        igdb_name -> igdb_title
        summary -> igdb_description
        release_date -> igdb_release_date
        cover_url -> igdb_cover_image
        genres -> igdb_genres
        platforms -> igdb_platforms

    Attributes:
        steam_app_id: Steam App ID
        name: Game name from Steam
        playtime: Playtime in minutes
        igdb_id: IGDB game ID (null if unmatched)
        igdb_title: Game title from IGDB
        igdb_slug: URL-friendly slug
        igdb_description: Game description/summary
        igdb_cover_image: Cover image URL
        igdb_release_date: Release date (ISO 8601 date string)
        igdb_genres: Comma-separated genre IDs (e.g., "5,12,31")
        igdb_platforms: Comma-separated platform IDs
        match_status: MATCHED, UNMATCHED, or IGNORED
    """

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    steam_app_id: str = Field(..., min_length=1, alias="appid")
    name: str = Field(..., min_length=1)
    playtime: int = Field(..., ge=0, alias="playtime_forever")
    igdb_id: int | None = None
    igdb_title: str | None = Field(default=None, alias="igdb_name")
    igdb_slug: str | None = None
    igdb_description: str | None = Field(default=None, alias="summary")
    igdb_cover_image: str | None = Field(default=None, alias="cover_url")
    igdb_release_date: str | None = Field(default=None, alias="release_date")
    igdb_genres: str | None = Field(default=None, alias="genres")
    igdb_platforms: str | None = Field(default=None, alias="platforms")
    match_status: IgdbMatchStatus

    @field_validator(
        "igdb_id",
        "igdb_title",
        "igdb_slug",
        "igdb_description",
        "igdb_cover_image",
        "igdb_release_date",
        "igdb_genres",
        "igdb_platforms",
        mode="before",
    )
    @classmethod
    def empty_string_to_none(cls, v: str | None) -> str | None:
        """Convert empty strings to None."""
        if v == "" or v == "null":
            return None
        return v

    @field_validator("igdb_id", mode="before")
    @classmethod
    def parse_optional_int(cls, v: str | int | None) -> int | None:
        """Parse optional integer fields."""
        if v is None or v == "" or v == "null":
            return None
        if isinstance(v, int):
            return v
        try:
            return int(v)
        except ValueError:
            return None

    @field_validator("match_status", mode="before")
    @classmethod
    def normalize_match_status(cls, v: str | IgdbMatchStatus) -> str:
        """Normalize match_status to uppercase for enum parsing."""
        if isinstance(v, IgdbMatchStatus):
            return v.value
        if isinstance(v, str):
            return v.upper()
        return v

    def parse_genre_ids(self) -> list[int]:
        """Parse comma-separated genre IDs into list of integers.

        Returns:
            List of IGDB genre IDs (empty if no genres)
        """
        if not self.igdb_genres:
            return []

        ids = []
        for genre_str in self.igdb_genres.split(","):
            genre_str = genre_str.strip()
            if genre_str:
                try:
                    ids.append(int(genre_str))
                except ValueError:
                    continue

        return ids

    def parse_platform_ids(self) -> list[int]:
        """Parse comma-separated platform IDs into list of integers.

        Returns:
            List of IGDB platform IDs (empty if no platforms)
        """
        if not self.igdb_platforms:
            return []

        ids = []
        for platform_str in self.igdb_platforms.split(","):
            platform_str = platform_str.strip()
            if platform_str:
                try:
                    ids.append(int(platform_str))
                except ValueError:
                    continue

        return ids

    def parse_release_date(self) -> datetime | None:
        """Parse release date string to datetime.

        Returns:
            Parsed datetime or None if parsing fails
        """
        if not self.igdb_release_date:
            return None

        try:
            return datetime.fromisoformat(self.igdb_release_date.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            return None


def _parse_s3_uri(s3_uri: str) -> tuple[str, str]:
    """Parse S3 URI into bucket and key.

    Args:
        s3_uri: S3 URI in format s3://bucket/key

    Returns:
        Tuple of (bucket, key)

    Raises:
        ValueError: If URI format is invalid
    """
    parsed = urlparse(s3_uri)
    bucket = parsed.netloc
    key = parsed.path.lstrip("/")

    if not bucket or not key:
        raise ValueError(f"Invalid S3 URI: {s3_uri}")

    return bucket, key


def _parse_enriched_csv(csv_content: str) -> list[EnrichedCsvRow]:
    """Parse enriched CSV content into validated row models.

    Args:
        csv_content: CSV string with enriched game data

    Returns:
        List of validated EnrichedCsvRow models

    Raises:
        ValueError: If CSV parsing or validation fails
    """
    logger = get_logger()

    input_stream = io.StringIO(csv_content)
    reader = csv.DictReader(input_stream)

    rows: list[EnrichedCsvRow] = []

    for i, row_dict in enumerate(reader, start=1):
        try:
            row = EnrichedCsvRow(**row_dict)
            rows.append(row)
        except Exception as e:
            logger.warning(
                "Failed to parse CSV row, skipping",
                row_number=i,
                error=str(e),
            )
            continue

    input_stream.close()

    logger.info("Parsed enriched CSV", total_rows=len(rows))

    return rows


def _check_record_exists(
    session: Any,
    model: Any,
    filter_conditions: dict[str, Any],
) -> bool:
    """Check if a record exists in the database.

    Args:
        session: SQLAlchemy session
        model: SQLAlchemy model class
        filter_conditions: Dictionary of column: value pairs for filtering

    Returns:
        True if record exists, False otherwise
    """
    from sqlalchemy import select

    stmt = select(model)
    for column, value in filter_conditions.items():
        stmt = stmt.where(getattr(model, column) == value)

    result = session.execute(stmt).scalar_one_or_none()
    return result is not None


def _import_row(
    session: Any,
    row: EnrichedCsvRow,
    user_id: str,
    stats: ImportStats,
) -> None:
    """Import a single CSV row into the database.

    This function orchestrates the import of one game:
    1. Always upsert ImportedGame
    2. If MATCHED: upsert Game, genres, platforms, and create LibraryItem
    3. If UNMATCHED: only ImportedGame is created

    Args:
        session: SQLAlchemy session
        row: Parsed enriched CSV row
        user_id: Owner user ID
        stats: Statistics tracker (mutated in place)
    """
    from lambdas.models.db import Game, ImportedGame

    logger = get_logger()

    # Step 1: Always upsert ImportedGame
    imported_game_exists = _check_record_exists(
        session,
        ImportedGame,
        {"storefrontGameId": row.steam_app_id, "userId": user_id},
    )

    imported_game_data = ImportedGameData(
        user_id=user_id,
        storefront_game_id=row.steam_app_id,
        name=row.name,
        storefront=Storefront.STEAM,
        playtime=row.playtime,
        img_icon_url=None,
        img_logo_url=None,
        igdb_match_status=row.match_status,
    )

    imported_game = upsert_imported_game(session, imported_game_data)

    if imported_game_exists:
        stats.imported_games_updated += 1
    else:
        stats.imported_games_created += 1

    logger.debug(
        "Upserted ImportedGame",
        steam_app_id=row.steam_app_id,
        imported_game_id=imported_game.id,
        match_status=row.match_status.value,
    )

    # Step 2: If MATCHED, import Game and create LibraryItem
    if row.match_status == IgdbMatchStatus.MATCHED:
        if not row.igdb_id:
            logger.warning(
                "MATCHED status but no igdb_id, skipping Game import",
                steam_app_id=row.steam_app_id,
            )
            return

        # Check if Game exists before upsert
        game_exists = _check_record_exists(
            session,
            Game,
            {"igdbId": row.igdb_id},
        )

        # Parse genre and platform IDs
        genre_ids = row.parse_genre_ids()
        platform_ids = row.parse_platform_ids()

        # Upsert genres (if provided)
        # Note: Using placeholder names because enriched CSV only contains IDs.
        # A background job will enrich these with actual names from IGDB.
        for genre_id in genre_ids:
            genre_data = GenreData(
                igdb_id=genre_id,
                name=f"Genre {genre_id}",
                slug=f"genre-{genre_id}",
                checksum=None,
            )
            upsert_genre(session, genre_data)

        # Upsert platforms (if provided)
        # Note: Using placeholder names because enriched CSV only contains IDs.
        # A background job will enrich these with actual names from IGDB.
        for platform_id in platform_ids:
            platform_data = PlatformData(
                igdb_id=platform_id,
                name=f"Platform {platform_id}",
                slug=f"platform-{platform_id}",
            )
            upsert_platform(session, platform_data)

        # Upsert Game
        game_data = GameData(
            igdb_id=row.igdb_id,
            title=row.igdb_title or row.name,
            slug=row.igdb_slug or f"game-{row.igdb_id}",
            steam_app_id=int(row.steam_app_id) if row.steam_app_id.isdigit() else None,
            description=row.igdb_description,
            cover_image=row.igdb_cover_image,
            release_date=row.parse_release_date(),
            franchise_id=None,
            genre_ids=genre_ids,
            platform_ids=platform_ids,
        )

        game = upsert_game(session, game_data)

        if game_exists:
            stats.games_updated += 1
        else:
            stats.games_created += 1

        logger.debug(
            "Upserted Game",
            steam_app_id=row.steam_app_id,
            igdb_id=row.igdb_id,
            game_id=game.id,
        )

        # Create LibraryItem (duplicate check handled by service)
        try:
            library_item_data = LibraryItemData(
                user_id=user_id,
                game_id=game.id,
                playtime=row.playtime,
                platform="PC (Steam)",  # Default platform for Steam imports
            )

            library_item = create_library_item(session, library_item_data)
            stats.library_items_created += 1

            logger.debug(
                "Created LibraryItem",
                library_item_id=library_item.id,
                game_id=game.id,
                status=library_item.status.value,
            )

        except ValueError:
            # LibraryItem already exists, skip
            logger.debug(
                "LibraryItem already exists, skipping",
                user_id=user_id,
                game_id=game.id,
            )


def _import_enriched_csv(event: DatabaseImportEvent) -> DatabaseImportResponse:
    """Internal implementation of database import logic.

    Args:
        event: Validated import event

    Returns:
        Import response with statistics or error
    """
    logger = get_logger()
    settings = get_settings()

    # Bind context for structured logging
    bind_context(user_id=event.user_id)

    logger.info("Starting database import", s3_location=event.s3_enriched_location)

    try:
        # Parse S3 URI
        bucket, key = _parse_s3_uri(event.s3_enriched_location)

        # Download CSV from S3
        s3_client = S3Client(bucket=bucket, region=settings.aws_region)
        csv_content = s3_client.download_csv(key)

        logger.info("Downloaded enriched CSV from S3", key=key, size_bytes=len(csv_content))

        # Parse CSV rows
        rows = _parse_enriched_csv(csv_content)

        if not rows:
            logger.warning("No valid rows in enriched CSV")
            return DatabaseImportResponse(
                success=True,
                stats=ImportStats(),
            )

        # Import rows with transaction
        stats = ImportStats()

        with get_session() as session:
            for row in rows:
                _import_row(session, row, event.user_id, stats)

            # Transaction is committed automatically by context manager

        logger.info(
            "Database import completed successfully",
            imported_games_created=stats.imported_games_created,
            imported_games_updated=stats.imported_games_updated,
            games_created=stats.games_created,
            games_updated=stats.games_updated,
            library_items_created=stats.library_items_created,
        )

        return DatabaseImportResponse(success=True, stats=stats)

    except S3Error as e:
        logger.error("S3 error during import", error=str(e), error_code=e.code)
        return DatabaseImportResponse(success=False, error=f"S3 error: {e.message}")

    except ValueError as e:
        logger.error("Validation error during import", error=str(e))
        return DatabaseImportResponse(success=False, error=f"Validation error: {e}")

    except Exception as e:
        logger.exception("Unexpected error during import")
        return DatabaseImportResponse(success=False, error=f"Unexpected error: {e}")


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    """AWS Lambda handler for database import.

    This is the entry point for Lambda invocation.

    Args:
        event: Lambda event containing user_id and s3_enriched_location
        _context: Lambda context (unused)

    Returns:
        Response dict with success status and import statistics
    """
    logger = get_logger()

    try:
        # Validate input
        try:
            validated_event = DatabaseImportEvent(**event)
        except Exception as e:
            logger.error("Invalid event", error=str(e))
            return DatabaseImportResponse(
                success=False,
                error=f"Invalid input: {e}",
            ).model_dump()

        # Run import
        response = _import_enriched_csv(validated_event)
        return response.model_dump()

    except Exception as e:
        logger.exception("Unexpected error in database_import handler")
        return DatabaseImportResponse(
            success=False,
            error=f"Unexpected error: {e}",
        ).model_dump()
