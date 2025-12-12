from __future__ import annotations

import asyncio
import csv
from datetime import UTC, datetime
from io import StringIO
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, Field

from lambdas.clients.igdb import IgdbClient
from lambdas.clients.s3 import S3Client
from lambdas.config import get_settings
from lambdas.errors import IgdbApiError, S3Error
from lambdas.logging import bind_context, get_logger
from lambdas.services.classifier import classify_steam_app

if TYPE_CHECKING:
    from lambdas.models.igdb import IgdbGame


class IgdbEnrichmentEvent(BaseModel):
    """Input event for the igdb_enrichment Lambda."""

    user_id: str = Field(..., min_length=1, description="The SavePoint user ID")
    s3_location: str = Field(
        ..., description="S3 URI of the raw CSV file (s3://bucket/key)"
    )


class EnrichmentStats(BaseModel):
    """Statistics from the enrichment process."""

    processed: int = Field(
        ..., description="Total number of Steam apps processed from CSV"
    )
    matched: int = Field(..., description="Number of games matched with IGDB")
    unmatched: int = Field(..., description="Number of games not found in IGDB")
    filtered: int = Field(..., description="Number of apps filtered (DLC, demos, etc.)")


class IgdbEnrichmentResponse(BaseModel):
    """Response from the igdb_enrichment Lambda."""

    success: bool
    s3_enriched_location: str | None = None
    stats: EnrichmentStats | None = None
    error: str | None = None


class EnrichedGameRow(BaseModel):
    """Model for a single row in the enriched CSV.

    Combines raw Steam data with IGDB enrichment and classification.
    """

    # Original Steam fields
    appid: int
    name: str
    playtime_forever: int
    img_icon_url: str
    rtime_last_played: str

    # IGDB enrichment fields
    igdb_id: str
    igdb_slug: str
    igdb_name: str
    summary: str
    release_date: str
    cover_url: str
    genres: str
    platforms: str

    # Classification and status
    classification: str
    match_status: str


async def _enrich_steam_library(
    event: IgdbEnrichmentEvent,
) -> IgdbEnrichmentResponse:
    """Internal async implementation of the IGDB enrichment logic.

    Args:
        event: Validated enrichment event

    Returns:
        Enrichment response with S3 location and statistics
    """
    logger = get_logger()
    settings = get_settings()

    # Bind context for structured logging
    bind_context(user_id=event.user_id, s3_location=event.s3_location)

    logger.info("Starting IGDB enrichment")

    # Parse S3 URI to extract key
    if not event.s3_location.startswith("s3://"):
        return IgdbEnrichmentResponse(
            success=False,
            error=f"Invalid S3 URI format: {event.s3_location}",
        )

    # Extract bucket and key from s3://bucket/key
    s3_parts = event.s3_location[5:].split("/", 1)
    if len(s3_parts) != 2:
        return IgdbEnrichmentResponse(
            success=False,
            error=f"Invalid S3 URI format: {event.s3_location}",
        )

    bucket, raw_key = s3_parts

    # Initialize statistics
    stats = EnrichmentStats(processed=0, matched=0, unmatched=0, filtered=0)

    try:
        # Download raw CSV from S3
        s3_client = S3Client(bucket=bucket, region=settings.aws_region)
        csv_content = s3_client.download_csv(raw_key)

        logger.info("Downloaded raw CSV from S3", key=raw_key)

        # Parse CSV
        raw_games = s3_client.csv_to_games(csv_content)

        if not raw_games:
            logger.warning("No games found in CSV file")
            return IgdbEnrichmentResponse(
                success=True,
                s3_enriched_location=None,
                stats=stats,
            )

        logger.info("Parsed CSV", game_count=len(raw_games))

        # Enrich games with IGDB data
        enriched_rows: list[EnrichedGameRow] = []

        async with IgdbClient(
            client_id=settings.igdb_client_id,
            client_secret=settings.igdb_client_secret,
        ) as igdb_client:
            for game_data in raw_games:
                stats.processed += 1

                appid_raw = game_data["appid"]
                name_raw = game_data.get("name")
                playtime_forever_raw = game_data.get("playtime_forever")
                img_icon_url_raw = game_data.get("img_icon_url")
                rtime_last_played_raw = game_data.get("rtime_last_played")

                # Normalize to expected types
                appid = int(appid_raw) if isinstance(appid_raw, int) else int(str(appid_raw))
                name = str(name_raw) if name_raw else ""
                playtime_forever = int(playtime_forever_raw) if playtime_forever_raw else 0
                img_icon_url = str(img_icon_url_raw) if img_icon_url_raw else ""
                rtime_last_played = str(rtime_last_played_raw) if rtime_last_played_raw else ""

                # Classify the Steam app
                classification_result = classify_steam_app(name if name else None)

                # Initialize row with base Steam data
                row = EnrichedGameRow(
                    appid=appid,
                    name=name,
                    playtime_forever=int(playtime_forever),
                    img_icon_url=img_icon_url,
                    rtime_last_played=rtime_last_played,
                    igdb_id="",
                    igdb_slug="",
                    igdb_name="",
                    summary="",
                    release_date="",
                    cover_url="",
                    genres="",
                    platforms="",
                    classification=classification_result.classification.value,
                    match_status="",
                )

                # Only enrich games, skip DLC/demos/etc.
                if not classification_result.should_enrich:
                    stats.filtered += 1
                    row.match_status = "filtered"
                    enriched_rows.append(row)

                    logger.debug(
                        "Filtered Steam app",
                        appid=appid,
                        name=name,
                        classification=classification_result.classification.value,
                    )
                    continue

                # This is a game - try to enrich with IGDB
                try:
                    igdb_game = await igdb_client.get_game_by_steam_app_id(appid)

                    if igdb_game:
                        stats.matched += 1
                        row = _populate_igdb_data(row, igdb_game)
                        row.match_status = "matched"

                        logger.debug(
                            "Matched game with IGDB",
                            appid=appid,
                            name=name,
                            igdb_id=igdb_game.id,
                        )
                    else:
                        stats.unmatched += 1
                        row.match_status = "unmatched"

                        logger.debug(
                            "No IGDB match found",
                            appid=appid,
                            name=name,
                        )

                except IgdbApiError as e:
                    # Log error but continue processing other games
                    stats.unmatched += 1
                    row.match_status = "error"

                    logger.error(
                        "IGDB API error during enrichment",
                        appid=appid,
                        name=name,
                        error=str(e),
                    )

                enriched_rows.append(row)

        logger.info(
            "Enrichment complete",
            processed=stats.processed,
            matched=stats.matched,
            unmatched=stats.unmatched,
            filtered=stats.filtered,
        )

        # Generate enriched CSV
        enriched_csv = _create_enriched_csv(enriched_rows)

        # Generate enriched S3 key
        enriched_key = s3_client.generate_enriched_csv_path(event.user_id)

        # Upload enriched CSV to S3
        s3_uri = s3_client.upload_csv(enriched_key, enriched_csv)

        logger.info(
            "Uploaded enriched CSV to S3",
            key=enriched_key,
            s3_uri=s3_uri,
        )

        return IgdbEnrichmentResponse(
            success=True,
            s3_enriched_location=s3_uri,
            stats=stats,
        )

    except S3Error as e:
        logger.error("S3 error", error=str(e), error_code=e.code)
        return IgdbEnrichmentResponse(success=False, error=f"S3 error: {e.message}")

    except Exception as e:
        logger.exception("Unexpected error during enrichment")
        return IgdbEnrichmentResponse(
            success=False, error=f"Unexpected error: {e}"
        )


def _populate_igdb_data(row: EnrichedGameRow, igdb_game: IgdbGame) -> EnrichedGameRow:
    """Populate an enriched row with IGDB game data.

    Args:
        row: Enriched row to populate
        igdb_game: IGDB game data

    Returns:
        Updated enriched row
    """
    row.igdb_id = str(igdb_game.id)
    row.igdb_slug = igdb_game.slug or ""
    row.igdb_name = igdb_game.name
    row.summary = igdb_game.summary or ""
    row.cover_url = igdb_game.cover_url or ""

    # Format genres as comma-separated string
    if igdb_game.genres:
        row.genres = ", ".join(g.name for g in igdb_game.genres)

    # Format platforms as comma-separated string
    if igdb_game.platforms:
        row.platforms = ", ".join(p.name for p in igdb_game.platforms)

    # Format release date
    if igdb_game.first_release_date:
        release_dt = datetime.fromtimestamp(igdb_game.first_release_date, tz=UTC)
        row.release_date = release_dt.strftime("%Y-%m-%d")

    return row


def _create_enriched_csv(rows: list[EnrichedGameRow]) -> str:
    """Create enriched CSV string from enriched game rows.

    Args:
        rows: List of enriched game rows

    Returns:
        CSV string with headers
    """
    output = StringIO(newline="")
    fieldnames = [
        "appid",
        "name",
        "playtime_forever",
        "img_icon_url",
        "rtime_last_played",
        "igdb_id",
        "igdb_slug",
        "igdb_name",
        "summary",
        "release_date",
        "cover_url",
        "genres",
        "platforms",
        "classification",
        "match_status",
    ]

    writer = csv.DictWriter(
        output,
        fieldnames=fieldnames,
        quoting=csv.QUOTE_MINIMAL,
        lineterminator="\n",
    )

    writer.writeheader()

    for row in rows:
        writer.writerow(row.model_dump())

    csv_content = output.getvalue()
    output.close()

    return csv_content


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    """AWS Lambda handler for IGDB enrichment.

    This is the entry point for Lambda invocation.

    Args:
        event: Lambda event containing user_id and s3_location
        _context: Lambda context (unused)

    Returns:
        Response dict with success status, S3 location, and statistics
    """
    logger = get_logger()

    try:
        # Validate input
        try:
            validated_event = IgdbEnrichmentEvent(**event)
        except Exception as e:
            logger.error("Invalid event", error=str(e))
            return IgdbEnrichmentResponse(
                success=False, error=f"Invalid input: {e}"
            ).model_dump()

        # Run async enrichment
        response = asyncio.run(_enrich_steam_library(validated_event))
        return response.model_dump()

    except Exception as e:
        logger.exception("Unexpected error in igdb_enrichment handler")
        return IgdbEnrichmentResponse(
            success=False, error=f"Unexpected error: {e}"
        ).model_dump()
