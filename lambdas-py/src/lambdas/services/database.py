"""Database service layer for Steam import pipeline.

This module provides SQLAlchemy session management and database operations
for the Lambda 3 (database_import) function. All operations are designed to be
idempotent for retry capability and use proper transaction management.

Architecture:
- Pydantic models for all input data (no raw dicts)
- Session management with context managers and connection pooling
- Upsert operations for ImportedGame, Game, Genre, Platform
- Library item creation with status based on playtime
- Proper error handling and structured logging
"""

from __future__ import annotations

from collections.abc import Generator
from contextlib import contextmanager, suppress
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator
from sqlalchemy import create_engine, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from lambdas.config import get_settings
from lambdas.logging import get_logger
from lambdas.models.db import (
    Game,
    GameGenre,
    GamePlatform,
    Genre,
    IgdbMatchStatus,
    ImportedGame,
    LibraryItem,
    LibraryItemStatus,
    Platform,
    Storefront,
)

logger = get_logger(service="database")

# ==================== Pydantic Models for Type Safety ====================


class ImportedGameData(BaseModel):
    """Input data for ImportedGame upsert operation.

    Attributes:
        user_id: Owner user ID
        storefront_game_id: Platform-specific game ID (e.g., Steam App ID)
        name: Game name from storefront
        storefront: Source platform (STEAM, PLAYSTATION, XBOX)
        playtime: Total playtime in minutes (default: 0)
        img_icon_url: Icon URL or hash from storefront
        img_logo_url: Logo URL or hash from storefront
        igdb_match_status: IGDB matching status
    """

    user_id: str = Field(..., min_length=1)
    storefront_game_id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    storefront: Storefront
    playtime: int = Field(default=0, ge=0)
    img_icon_url: str | None = None
    img_logo_url: str | None = None
    igdb_match_status: IgdbMatchStatus = IgdbMatchStatus.PENDING


class GenreData(BaseModel):
    """Input data for Genre upsert operation.

    Attributes:
        igdb_id: IGDB genre ID (unique identifier for upsert)
        name: Genre name
        slug: URL-friendly identifier
        checksum: IGDB checksum for change detection
    """

    igdb_id: int = Field(..., gt=0)
    name: str = Field(..., min_length=1)
    slug: str = Field(..., min_length=1)
    checksum: str | None = None


class PlatformData(BaseModel):
    """Input data for Platform upsert operation.

    Attributes:
        igdb_id: IGDB platform ID (unique identifier for upsert)
        name: Platform name
        slug: URL-friendly identifier
        abbreviation: Short name (e.g., "PC")
        alternative_name: Alternative platform name
        generation: Console generation number
        platform_family: IGDB platform family ID
        platform_type: IGDB platform type ID
        checksum: IGDB checksum for change detection
    """

    igdb_id: int = Field(..., gt=0)
    name: str = Field(..., min_length=1)
    slug: str = Field(..., min_length=1)
    abbreviation: str | None = None
    alternative_name: str | None = None
    generation: int | None = None
    platform_family: int | None = None
    platform_type: int | None = None
    checksum: str | None = None


class GameData(BaseModel):
    """Input data for Game upsert operation.

    Attributes:
        igdb_id: IGDB game ID (primary upsert key)
        title: Game title from IGDB
        slug: URL-friendly identifier
        steam_app_id: Steam App ID for fallback matching
        description: Game description/summary
        cover_image: Cover image URL
        release_date: First release date
        franchise_id: IGDB franchise ID
        genre_ids: List of IGDB genre IDs (must be upserted first)
        platform_ids: List of IGDB platform IDs (must be upserted first)
    """

    igdb_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=1)
    slug: str = Field(..., min_length=1)
    steam_app_id: int | None = Field(default=None, gt=0)
    description: str | None = None
    cover_image: str | None = None
    release_date: datetime | None = None
    franchise_id: int | None = Field(default=None, gt=0)
    genre_ids: list[int] = Field(default_factory=list)
    platform_ids: list[int] = Field(default_factory=list)

    @field_validator("genre_ids", "platform_ids", mode="before")
    @classmethod
    def ensure_list(cls, v: Any) -> list[int]:
        """Ensure genre_ids and platform_ids are lists."""
        if v is None:
            return []
        if isinstance(v, list):
            return v
        raise TypeError(f"Expected list, got {type(v)}")


class LibraryItemData(BaseModel):
    """Input data for LibraryItem creation.

    Attributes:
        user_id: Owner user ID
        game_id: Game ID (cuid from Game table)
        playtime: Total playtime in minutes (determines status)
        platform: Platform name (e.g., "PC", "PlayStation 5")
    """

    user_id: str = Field(..., min_length=1)
    game_id: str = Field(..., min_length=1)
    playtime: int = Field(..., ge=0)
    platform: str | None = None


# ==================== Session Management ====================

_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def _get_engine() -> Engine:
    """Get or create SQLAlchemy engine with connection pooling.

    Returns:
        SQLAlchemy Engine instance with connection pooling configured.

    Note:
        Engine is a singleton to reuse connection pool across Lambda invocations.
        Pool settings are optimized for Lambda execution model:
        - pool_size=2: Minimal connections for Lambda's single-threaded execution
        - max_overflow=3: Allow burst capacity for concurrent operations
        - pool_pre_ping=True: Validate connections before use (handles stale connections)
    """
    global _engine

    if _engine is None:
        settings = get_settings()
        logger.debug("Creating SQLAlchemy engine", database_url=settings.database_url)

        _engine = create_engine(
            settings.database_url,
            pool_size=2,
            max_overflow=3,
            pool_pre_ping=True,
            echo=False,
        )

    return _engine


def _get_session_factory() -> sessionmaker[Session]:
    """Get or create session factory.

    Returns:
        SQLAlchemy sessionmaker configured with engine.

    Note:
        Session factory is cached to avoid recreation overhead.
    """
    global _session_factory

    if _session_factory is None:
        engine = _get_engine()
        _session_factory = sessionmaker(bind=engine, expire_on_commit=False)

    return _session_factory


@contextmanager
def get_session() -> Generator[Session, None, None]:
    """Context manager for database sessions with automatic transaction management.

    Yields:
        SQLAlchemy Session instance.

    Raises:
        Exception: Any database error is logged and re-raised after rollback.

    Example:
        >>> with get_session() as session:
        ...     game = upsert_game(session, game_data)
        ...     # Transaction is committed on successful exit
        ...     # Transaction is rolled back on exception
    """
    factory = _get_session_factory()
    session = factory()

    try:
        logger.debug("Database session started")
        yield session
        session.commit()
        logger.debug("Database session committed")
    except Exception as e:
        session.rollback()
        logger.error("Database session rolled back", error=str(e), exc_info=True)
        raise
    finally:
        session.close()
        logger.debug("Database session closed")


# ==================== Upsert Operations ====================


def upsert_imported_game(session: Session, data: ImportedGameData) -> ImportedGame:
    """Upsert ImportedGame record by storefrontGameId + userId.

    Args:
        session: Active SQLAlchemy session
        data: ImportedGame input data

    Returns:
        The upserted ImportedGame record

    Note:
        Updates updatedAt timestamp on conflict.
        Preserves id and createdAt from existing record.
    """
    logger.debug(
        "Upserting ImportedGame",
        user_id=data.user_id,
        storefront_game_id=data.storefront_game_id,
        storefront=data.storefront.value,
    )

    # Query for existing record
    stmt = select(ImportedGame).where(
        ImportedGame.storefrontGameId == data.storefront_game_id,
        ImportedGame.userId == data.user_id,
    )
    existing = session.execute(stmt).scalar_one_or_none()

    if existing:
        # Update existing record
        logger.debug("Updating existing ImportedGame", imported_game_id=existing.id)
        existing.name = data.name
        existing.storefront = data.storefront
        existing.playtime = data.playtime
        existing.img_icon_url = data.img_icon_url
        existing.img_logo_url = data.img_logo_url
        existing.igdbMatchStatus = data.igdb_match_status
        existing.updatedAt = datetime.now(UTC)
        return existing
    else:
        # Create new record
        logger.debug("Creating new ImportedGame")
        now = datetime.now(UTC)
        imported_game = ImportedGame(
            name=data.name,
            storefront=data.storefront,
            storefrontGameId=data.storefront_game_id,
            playtime=data.playtime,
            img_icon_url=data.img_icon_url,
            img_logo_url=data.img_logo_url,
            igdbMatchStatus=data.igdb_match_status,
            userId=data.user_id,
            createdAt=now,
            updatedAt=now,
        )
        session.add(imported_game)
        session.flush()
        logger.info("Created ImportedGame", imported_game_id=imported_game.id)
        return imported_game


def upsert_genre(session: Session, data: GenreData) -> Genre:
    """Upsert Genre record by igdbId.

    Args:
        session: Active SQLAlchemy session
        data: Genre input data

    Returns:
        The upserted Genre record

    Note:
        Updates all fields and updatedAt timestamp on conflict.
    """
    logger.debug("Upserting Genre", igdb_id=data.igdb_id, name=data.name)

    # Query for existing record
    stmt = select(Genre).where(Genre.igdbId == data.igdb_id)
    existing = session.execute(stmt).scalar_one_or_none()

    if existing:
        # Update existing record
        logger.debug("Updating existing Genre", genre_id=existing.id)
        existing.name = data.name
        existing.slug = data.slug
        existing.checksum = data.checksum
        existing.updatedAt = datetime.now(UTC)
        return existing
    else:
        # Create new record
        logger.debug("Creating new Genre")
        now = datetime.now(UTC)
        genre = Genre(
            igdbId=data.igdb_id,
            name=data.name,
            slug=data.slug,
            checksum=data.checksum,
            createdAt=now,
            updatedAt=now,
        )
        session.add(genre)
        session.flush()
        logger.info("Created Genre", genre_id=genre.id, igdb_id=genre.igdbId)
        return genre


def upsert_platform(session: Session, data: PlatformData) -> Platform:
    """Upsert Platform record by igdbId.

    Args:
        session: Active SQLAlchemy session
        data: Platform input data

    Returns:
        The upserted Platform record

    Note:
        Updates all fields and updatedAt timestamp on conflict.
    """
    logger.debug("Upserting Platform", igdb_id=data.igdb_id, name=data.name)

    # Query for existing record
    stmt = select(Platform).where(Platform.igdbId == data.igdb_id)
    existing = session.execute(stmt).scalar_one_or_none()

    if existing:
        # Update existing record
        logger.debug("Updating existing Platform", platform_id=existing.id)
        existing.name = data.name
        existing.slug = data.slug
        existing.abbreviation = data.abbreviation
        existing.alternativeName = data.alternative_name
        existing.generation = data.generation
        existing.platformFamily = data.platform_family
        existing.platformType = data.platform_type
        existing.checksum = data.checksum
        existing.updatedAt = datetime.now(UTC)
        return existing
    else:
        # Create new record
        logger.debug("Creating new Platform")
        now = datetime.now(UTC)
        platform = Platform(
            igdbId=data.igdb_id,
            name=data.name,
            slug=data.slug,
            abbreviation=data.abbreviation,
            alternativeName=data.alternative_name,
            generation=data.generation,
            platformFamily=data.platform_family,
            platformType=data.platform_type,
            checksum=data.checksum,
            createdAt=now,
            updatedAt=now,
        )
        session.add(platform)
        session.flush()
        logger.info("Created Platform", platform_id=platform.id, igdb_id=platform.igdbId)
        return platform


def upsert_game(session: Session, data: GameData) -> Game:
    """Upsert Game record by igdbId (primary) or steamAppId (fallback).

    This function handles the complex logic of matching games:
    1. Try to match by igdbId (primary key from IGDB)
    2. If no igdbId match, try steamAppId (for cross-platform matching)
    3. Upsert genre and platform relationships (many-to-many)

    Args:
        session: Active SQLAlchemy session
        data: Game input data with genre_ids and platform_ids

    Returns:
        The upserted Game record

    Note:
        Genre and Platform records must exist before calling this function.
        Use upsert_genre() and upsert_platform() first if needed.
    """
    logger.debug(
        "Upserting Game",
        igdb_id=data.igdb_id,
        steam_app_id=data.steam_app_id,
        title=data.title,
    )

    # Query for existing record (primary: igdbId, fallback: steamAppId)
    stmt = select(Game).where(Game.igdbId == data.igdb_id)
    existing = session.execute(stmt).scalar_one_or_none()

    if not existing and data.steam_app_id:
        # Fallback: try to match by steamAppId
        stmt = select(Game).where(Game.steamAppId == data.steam_app_id)
        existing = session.execute(stmt).scalar_one_or_none()
        if existing:
            logger.debug(
                "Found Game by steamAppId fallback",
                game_id=existing.id,
                steam_app_id=data.steam_app_id,
            )

    if existing:
        # Update existing record
        logger.debug("Updating existing Game", game_id=existing.id)
        existing.igdbId = data.igdb_id
        existing.title = data.title
        existing.slug = data.slug
        existing.description = data.description
        existing.coverImage = data.cover_image
        existing.releaseDate = data.release_date
        existing.steamAppId = data.steam_app_id
        existing.franchiseId = data.franchise_id
        existing.updatedAt = datetime.now(UTC)
        game = existing
    else:
        # Create new record
        logger.debug("Creating new Game")
        now = datetime.now(UTC)
        game = Game(
            igdbId=data.igdb_id,
            title=data.title,
            slug=data.slug,
            description=data.description,
            coverImage=data.cover_image,
            releaseDate=data.release_date,
            steamAppId=data.steam_app_id,
            franchiseId=data.franchise_id,
            createdAt=now,
            updatedAt=now,
        )
        session.add(game)
        session.flush()
        logger.info("Created Game", game_id=game.id, igdb_id=game.igdbId)

    # Handle genre relationships
    _update_game_genres(session, game, data.genre_ids)

    # Handle platform relationships
    _update_game_platforms(session, game, data.platform_ids)

    return game


def _update_game_genres(session: Session, game: Game, genre_igdb_ids: list[int]) -> None:
    """Update Game-Genre relationships.

    Args:
        session: Active SQLAlchemy session
        game: Game record to update
        genre_igdb_ids: List of IGDB genre IDs to associate with game

    Note:
        This function is idempotent - it removes old relationships and creates new ones.
        Genre records must exist before calling (use upsert_genre first).
    """
    if not genre_igdb_ids:
        logger.debug("No genres to update for Game", game_id=game.id)
        return

    logger.debug("Updating Game genres", game_id=game.id, genre_count=len(genre_igdb_ids))

    # Remove existing genre relationships
    session.query(GameGenre).filter(GameGenre.gameId == game.id).delete()

    # Fetch genre records by igdbId
    stmt = select(Genre).where(Genre.igdbId.in_(genre_igdb_ids))
    genres = session.execute(stmt).scalars().all()

    if len(genres) != len(genre_igdb_ids):
        found_ids = {g.igdbId for g in genres}
        missing_ids = set(genre_igdb_ids) - found_ids
        logger.warning(
            "Some genres not found in database",
            game_id=game.id,
            missing_igdb_ids=list(missing_ids),
        )

    # Create new relationships
    for genre in genres:
        game_genre = GameGenre(gameId=game.id, genreId=genre.id)
        session.add(game_genre)

    logger.debug("Updated Game genres", game_id=game.id, genres_added=len(genres))


def _update_game_platforms(session: Session, game: Game, platform_igdb_ids: list[int]) -> None:
    """Update Game-Platform relationships.

    Args:
        session: Active SQLAlchemy session
        game: Game record to update
        platform_igdb_ids: List of IGDB platform IDs to associate with game

    Note:
        This function is idempotent - it removes old relationships and creates new ones.
        Platform records must exist before calling (use upsert_platform first).
    """
    if not platform_igdb_ids:
        logger.debug("No platforms to update for Game", game_id=game.id)
        return

    logger.debug(
        "Updating Game platforms", game_id=game.id, platform_count=len(platform_igdb_ids)
    )

    # Remove existing platform relationships
    session.query(GamePlatform).filter(GamePlatform.gameId == game.id).delete()

    # Fetch platform records by igdbId
    stmt = select(Platform).where(Platform.igdbId.in_(platform_igdb_ids))
    platforms = session.execute(stmt).scalars().all()

    if len(platforms) != len(platform_igdb_ids):
        found_ids = {p.igdbId for p in platforms}
        missing_ids = set(platform_igdb_ids) - found_ids
        logger.warning(
            "Some platforms not found in database",
            game_id=game.id,
            missing_igdb_ids=list(missing_ids),
        )

    # Create new relationships
    for platform in platforms:
        game_platform = GamePlatform(gameId=game.id, platformId=platform.id)
        session.add(game_platform)

    logger.debug("Updated Game platforms", game_id=game.id, platforms_added=len(platforms))


def create_library_item(session: Session, data: LibraryItemData) -> LibraryItem:
    """Create LibraryItem record with status based on playtime.

    Status Logic:
    - playtime == 0 → CURIOUS_ABOUT (never played, just curious)
    - playtime > 0 → EXPERIENCED (has played, some experience)

    Args:
        session: Active SQLAlchemy session
        data: LibraryItem input data

    Returns:
        The created LibraryItem record

    Raises:
        ValueError: If LibraryItem already exists for user + game

    Note:
        This function does NOT upsert - it creates new records only.
        Use it for initial import where duplicates should not exist.
        Duplicate detection is enforced to prevent data corruption.
    """
    logger.debug(
        "Creating LibraryItem",
        user_id=data.user_id,
        game_id=data.game_id,
        playtime=data.playtime,
    )

    # Check for existing library item (duplicate detection)
    stmt = select(LibraryItem).where(
        LibraryItem.userId == data.user_id,
        LibraryItem.gameId == data.game_id,
    )
    existing = session.execute(stmt).scalars().first()

    if existing:
        logger.warning(
            "LibraryItem already exists, skipping creation",
            library_item_id=existing.id,
            user_id=data.user_id,
            game_id=data.game_id,
        )
        raise ValueError(
            f"LibraryItem already exists for user {data.user_id} and game {data.game_id}"
        )

    # Determine status based on playtime
    status = LibraryItemStatus.CURIOUS_ABOUT if data.playtime == 0 else LibraryItemStatus.EXPERIENCED

    logger.debug("Determined LibraryItem status", status=status.value, playtime=data.playtime)

    # Create new library item
    now = datetime.now(UTC)
    library_item = LibraryItem(
        userId=data.user_id,
        gameId=data.game_id,
        status=status,
        platform=data.platform,
        createdAt=now,
        updatedAt=now,
    )

    session.add(library_item)
    session.flush()

    logger.info(
        "Created LibraryItem",
        library_item_id=library_item.id,
        user_id=data.user_id,
        game_id=data.game_id,
        status=status.value,
    )

    return library_item


# ==================== DatabaseService Class ====================


class DatabaseService:
    """High-level database service for Steam import pipeline.

    Wraps standalone database functions with session management. Each method
    handles its own transaction using the get_session() context manager.

    Optionally accepts an external session for testing scenarios where
    transaction isolation is needed.

    Example:
        >>> db_service = DatabaseService()
        >>> game = db_service.upsert_imported_game(game_data)

        >>> # With external session (for testing)
        >>> db_service = DatabaseService(session=test_session)
        >>> game = db_service.upsert_imported_game(game_data)
    """

    def __init__(self, session: Session | None = None) -> None:
        """Initialize DatabaseService.

        Args:
            session: Optional external session. If provided, this session
                will be used for all operations (no auto-commit/rollback).
                If not provided, each method manages its own session.
        """
        self._external_session = session

    def _get_session_context(self) -> Generator[Session, None, None]:
        """Get session context - either external or managed.

        Returns:
            Generator yielding a Session instance.
        """
        if self._external_session is not None:
            # Use external session without auto-commit
            yield self._external_session
        else:
            # Use managed session with auto-commit
            with get_session() as session:
                yield session

    def upsert_imported_game(self, data: ImportedGameData) -> ImportedGame:
        """Upsert ImportedGame record.

        Args:
            data: ImportedGame input data

        Returns:
            The upserted ImportedGame record
        """
        session_gen = self._get_session_context()
        session = next(session_gen)
        try:
            return upsert_imported_game(session, data)
        finally:
            with suppress(StopIteration):
                next(session_gen)

    def upsert_genre(self, data: GenreData) -> Genre:
        """Upsert Genre record.

        Args:
            data: Genre input data

        Returns:
            The upserted Genre record
        """
        session_gen = self._get_session_context()
        session = next(session_gen)
        try:
            return upsert_genre(session, data)
        finally:
            with suppress(StopIteration):
                next(session_gen)

    def upsert_platform(self, data: PlatformData) -> Platform:
        """Upsert Platform record.

        Args:
            data: Platform input data

        Returns:
            The upserted Platform record
        """
        session_gen = self._get_session_context()
        session = next(session_gen)
        try:
            return upsert_platform(session, data)
        finally:
            with suppress(StopIteration):
                next(session_gen)

    def upsert_game(self, data: GameData) -> Game:
        """Upsert Game record with genres and platforms.

        Args:
            data: Game input data with genre_ids and platform_ids

        Returns:
            The upserted Game record
        """
        session_gen = self._get_session_context()
        session = next(session_gen)
        try:
            return upsert_game(session, data)
        finally:
            with suppress(StopIteration):
                next(session_gen)

    def create_library_item(self, data: LibraryItemData) -> LibraryItem:
        """Create LibraryItem record with status based on playtime.

        Args:
            data: LibraryItem input data

        Returns:
            The created LibraryItem record

        Raises:
            ValueError: If LibraryItem already exists for user + game
        """
        session_gen = self._get_session_context()
        session = next(session_gen)
        try:
            return create_library_item(session, data)
        finally:
            with suppress(StopIteration):
                next(session_gen)
