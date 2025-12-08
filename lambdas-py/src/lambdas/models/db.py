"""SQLAlchemy database models mirroring Prisma schema.

This module contains SQLAlchemy ORM models that exactly mirror the Prisma schema
used by the main SavePoint application. These models enable the Lambda functions
to interact with the PostgreSQL database using Python while maintaining schema
compatibility with the TypeScript/Prisma application.

Key Design Principles:
- Field types and constraints match Prisma exactly
- Primary keys use cuid strings where Prisma uses @default(cuid())
- Foreign key relationships match Prisma relation definitions
- Enums are defined as Python enums and SQLAlchemy Enum columns
- Timestamps use timezone-aware datetime with server defaults
- Unique constraints and indexes match Prisma schema

Note:
    Only models required by the import pipeline are defined here.
    The User model is included minimally for FK resolution.
    Models like Account, Session, Review, and JournalEntry are omitted
    as they are not needed by Lambda functions.
"""

from __future__ import annotations

import secrets
import string
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import Enum as SQLEnum

# ==================== CUID Generation ====================


def generate_cuid() -> str:
    """Generate a cuid-compatible identifier.

    Prisma uses the cuid() function which generates 25-character identifiers.
    This function creates similar identifiers using secure random generation.

    Format: c + timestamp_base36 + counter_base36 + random_base36
    Length: 25 characters (1 + 8 + 4 + 12)

    Returns:
        A 25-character cuid-like string identifier.

    Example:
        >>> cuid = generate_cuid()
        >>> len(cuid)
        25
        >>> cuid[0]
        'c'
    """
    # Start with 'c' prefix (cuid convention)
    prefix = "c"

    # Timestamp component (8 chars base36)
    timestamp = int(datetime.now().timestamp() * 1000)
    timestamp_b36 = _to_base36(timestamp)[-8:].rjust(8, "0")

    # Counter component (4 chars base36) - using random for simplicity
    counter = secrets.randbelow(1679616)  # 36^4
    counter_b36 = _to_base36(counter)[-4:].rjust(4, "0")

    # Random component (12 chars)
    alphabet = string.ascii_lowercase + string.digits
    random_part = "".join(secrets.choice(alphabet) for _ in range(12))

    return f"{prefix}{timestamp_b36}{counter_b36}{random_part}"


def _to_base36(num: int) -> str:
    """Convert integer to base36 string.

    Args:
        num: Integer to convert

    Returns:
        Base36 string representation
    """
    if num == 0:
        return "0"

    chars = "0123456789abcdefghijklmnopqrstuvwxyz"
    result = ""
    while num > 0:
        result = chars[num % 36] + result
        num //= 36
    return result


# ==================== Base ====================


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""

    pass


# ==================== Enums ====================


class Storefront(PyEnum):
    """Gaming platform storefront.

    Attributes:
        STEAM: Valve's Steam platform
        PLAYSTATION: Sony PlayStation platform
        XBOX: Microsoft Xbox platform
    """

    STEAM = "STEAM"
    PLAYSTATION = "PLAYSTATION"
    XBOX = "XBOX"


class LibraryItemStatus(PyEnum):
    """Status of a game in user's library.

    Attributes:
        CURIOUS_ABOUT: User is interested but hasn't played (default for 0 playtime)
        CURRENTLY_EXPLORING: User is actively playing
        TOOK_A_BREAK: User paused playing
        EXPERIENCED: User has played/completed (default for >0 playtime on import)
        WISHLIST: User wants to acquire
        REVISITING: User is replaying
    """

    CURIOUS_ABOUT = "CURIOUS_ABOUT"
    CURRENTLY_EXPLORING = "CURRENTLY_EXPLORING"
    TOOK_A_BREAK = "TOOK_A_BREAK"
    EXPERIENCED = "EXPERIENCED"
    WISHLIST = "WISHLIST"
    REVISITING = "REVISITING"


class IgdbMatchStatus(PyEnum):
    """IGDB matching status for imported games.

    Attributes:
        PENDING: Initial state, not yet processed by enrichment pipeline
        MATCHED: Successfully matched to an IGDB game entry
        UNMATCHED: Could not be matched to IGDB (requires manual review)
        IGNORED: User chose to ignore this game (won't be imported)
    """

    PENDING = "PENDING"
    MATCHED = "MATCHED"
    UNMATCHED = "UNMATCHED"
    IGNORED = "IGNORED"


# ==================== User Model (minimal for FK resolution) ====================


class User(Base):
    """User model (minimal for FK resolution).

    Only fields needed for FK relationships are defined here.
    Full User management is handled by the main SavePoint application.

    Attributes:
        id: Primary key (cuid string)
        createdAt: Record creation timestamp
        updatedAt: Record last update timestamp
    """

    __tablename__ = "User"

    id: Mapped[str] = mapped_column(String(25), primary_key=True)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ==================== Application Models ====================


class ImportedGame(Base):
    """Raw imported game data from external storefronts.

    This table stores the original game data fetched from storefronts like Steam
    before IGDB enrichment. Records are upserted by (storefrontGameId, userId).

    Attributes:
        id: Primary key (cuid string)
        name: Game name from storefront
        storefront: Source platform (STEAM, PLAYSTATION, XBOX)
        storefrontGameId: Platform-specific game ID (e.g., Steam App ID)
        playtime: Total playtime in minutes
        img_icon_url: Icon URL or hash from storefront
        img_logo_url: Logo URL or hash from storefront
        igdbMatchStatus: IGDB matching status (PENDING, MATCHED, UNMATCHED, IGNORED)
        createdAt: Record creation timestamp
        updatedAt: Record last update timestamp
        deletedAt: Soft deletion timestamp (NULL if not deleted)
        userId: Owner user ID (foreign key)
    """

    __tablename__ = "ImportedGame"

    id: Mapped[str] = mapped_column(String(25), primary_key=True, default=generate_cuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    storefront: Mapped[Storefront] = mapped_column(
        SQLEnum(Storefront, native_enum=False, length=20), nullable=False
    )
    storefrontGameId: Mapped[str | None] = mapped_column(String, nullable=True)
    playtime: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    img_icon_url: Mapped[str | None] = mapped_column(String, nullable=True)
    img_logo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    igdbMatchStatus: Mapped[IgdbMatchStatus] = mapped_column(
        SQLEnum(IgdbMatchStatus, native_enum=False, length=20),
        default=IgdbMatchStatus.PENDING,
        nullable=False,
    )
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deletedAt: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    userId: Mapped[str] = mapped_column(String(25), ForeignKey("User.id"), nullable=False)

    # Indexes matching Prisma schema
    __table_args__ = (
        Index("ImportedGame_userId_deletedAt_idx", "userId", "deletedAt"),
        Index("ImportedGame_storefrontGameId_idx", "storefrontGameId"),
    )


class Game(Base):
    """Core game entity with IGDB metadata.

    This table stores canonical game data enriched from IGDB. Records are
    upserted by igdbId (primary match) or steamAppId (fallback).

    Attributes:
        id: Primary key (cuid string)
        igdbId: IGDB game ID (unique, used for matching)
        hltbId: HowLongToBeat game ID (optional)
        title: Game title from IGDB
        description: Game description/summary
        coverImage: Cover image URL
        releaseDate: First release date
        mainStory: Main story completion time (minutes)
        mainExtra: Main + extras completion time (minutes)
        completionist: 100% completion time (minutes)
        createdAt: Record creation timestamp
        updatedAt: Record last update timestamp
        steamAppId: Steam App ID for cross-platform matching
        slug: URL-friendly identifier (unique)
        franchiseId: IGDB franchise ID (optional)
    """

    __tablename__ = "Game"

    id: Mapped[str] = mapped_column(String(25), primary_key=True, default=generate_cuid)
    igdbId: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    hltbId: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    coverImage: Mapped[str | None] = mapped_column(String, nullable=True)
    releaseDate: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    mainStory: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mainExtra: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completionist: Mapped[int | None] = mapped_column(Integer, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    steamAppId: Mapped[int | None] = mapped_column(Integer, nullable=True)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    franchiseId: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Relationships to join tables
    genres: Mapped[list[GameGenre]] = relationship(
        "GameGenre", back_populates="game", cascade="all, delete-orphan"
    )
    platforms: Mapped[list[GamePlatform]] = relationship(
        "GamePlatform", back_populates="game", cascade="all, delete-orphan"
    )

    # Index matching Prisma schema
    __table_args__ = (Index("Game_slug_idx", "slug"),)


class LibraryItem(Base):
    """User's game library entry.

    Each record represents a game in a user's personal library with status,
    platform, acquisition type, and play dates.

    Attributes:
        id: Primary key (auto-increment integer)
        status: Current status (CURIOUS_ABOUT, EXPERIENCED, etc.)
        createdAt: Record creation timestamp
        updatedAt: Record last update timestamp
        platform: Platform name (e.g., "PC", "PlayStation 5")
        userId: Owner user ID (foreign key)
        acquisitionType: How game was acquired (not used in import pipeline)
        gameId: Game ID (foreign key)
        startedAt: When user started playing (optional)
        completedAt: When user completed playing (optional)
    """

    __tablename__ = "LibraryItem"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    status: Mapped[LibraryItemStatus] = mapped_column(
        SQLEnum(LibraryItemStatus, native_enum=False, length=30),
        default=LibraryItemStatus.CURIOUS_ABOUT,
        nullable=False,
    )
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    platform: Mapped[str | None] = mapped_column(String, nullable=True)
    userId: Mapped[str] = mapped_column(String(25), ForeignKey("User.id"), nullable=False)
    gameId: Mapped[str] = mapped_column(
        String(25), ForeignKey("Game.id", ondelete="CASCADE"), nullable=False
    )
    startedAt: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completedAt: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Note: acquisitionType field exists in Prisma but is not used in import pipeline
    # We omit it here to keep models focused on import functionality

    # Indexes matching Prisma schema
    __table_args__ = (
        Index("LibraryItem_userId_status_idx", "userId", "status"),
        Index("LibraryItem_userId_platform_idx", "userId", "platform"),
        Index("LibraryItem_userId_createdAt_idx", "userId", "createdAt"),
        Index("LibraryItem_gameId_idx", "gameId"),
    )


# ==================== Game Metadata Models ====================


class Genre(Base):
    """Game genre from IGDB.

    Attributes:
        id: Primary key (cuid string)
        igdbId: IGDB genre ID (unique, used for upsert)
        name: Genre name (unique, e.g., "Strategy", "RPG")
        slug: URL-friendly identifier (unique)
        checksum: IGDB checksum for change detection (optional)
        createdAt: Record creation timestamp
        updatedAt: Record last update timestamp
    """

    __tablename__ = "Genre"

    id: Mapped[str] = mapped_column(String(25), primary_key=True, default=generate_cuid)
    igdbId: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    checksum: Mapped[str | None] = mapped_column(String, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationship to join table
    games: Mapped[list[GameGenre]] = relationship(
        "GameGenre", back_populates="genre", cascade="all, delete-orphan"
    )

    # Indexes matching Prisma schema
    __table_args__ = (
        Index("Genre_slug_idx", "slug"),
        Index("Genre_name_idx", "name"),
    )


class Platform(Base):
    """Gaming platform from IGDB.

    Attributes:
        id: Primary key (cuid string)
        igdbId: IGDB platform ID (unique, used for upsert)
        name: Platform name (unique, e.g., "PC (Microsoft Windows)")
        slug: URL-friendly identifier (unique)
        abbreviation: Short name (e.g., "PC")
        alternativeName: Alternative platform name
        generation: Console generation number
        platformFamily: IGDB platform family ID
        platformType: IGDB platform type ID
        checksum: IGDB checksum for change detection (optional)
        createdAt: Record creation timestamp
        updatedAt: Record last update timestamp
    """

    __tablename__ = "Platform"

    id: Mapped[str] = mapped_column(String(25), primary_key=True, default=generate_cuid)
    igdbId: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    abbreviation: Mapped[str | None] = mapped_column(String, nullable=True)
    alternativeName: Mapped[str | None] = mapped_column(String, nullable=True)
    generation: Mapped[int | None] = mapped_column(Integer, nullable=True)
    platformFamily: Mapped[int | None] = mapped_column(Integer, nullable=True)
    platformType: Mapped[int | None] = mapped_column(Integer, nullable=True)
    checksum: Mapped[str | None] = mapped_column(String, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationship to join table
    games: Mapped[list[GamePlatform]] = relationship(
        "GamePlatform", back_populates="platform", cascade="all, delete-orphan"
    )

    # Indexes matching Prisma schema
    __table_args__ = (
        Index("Platform_slug_idx", "slug"),
        Index("Platform_name_idx", "name"),
    )


# ==================== Join Tables ====================


class GameGenre(Base):
    """Many-to-many relationship between Game and Genre.

    Composite primary key on (gameId, genreId) matches Prisma @@id directive.

    Attributes:
        gameId: Game ID (foreign key, part of composite PK)
        genreId: Genre ID (foreign key, part of composite PK)
    """

    __tablename__ = "GameGenre"

    gameId: Mapped[str] = mapped_column(
        String(25), ForeignKey("Game.id", ondelete="CASCADE"), primary_key=True
    )
    genreId: Mapped[str] = mapped_column(
        String(25), ForeignKey("Genre.id", ondelete="CASCADE"), primary_key=True
    )

    # Relationships
    game: Mapped[Game] = relationship("Game", back_populates="genres")
    genre: Mapped[Genre] = relationship("Genre", back_populates="games")

    # Indexes matching Prisma schema
    __table_args__ = (
        Index("GameGenre_gameId_idx", "gameId"),
        Index("GameGenre_genreId_idx", "genreId"),
    )


class GamePlatform(Base):
    """Many-to-many relationship between Game and Platform.

    Composite primary key on (gameId, platformId) matches Prisma @@id directive.

    Attributes:
        gameId: Game ID (foreign key, part of composite PK)
        platformId: Platform ID (foreign key, part of composite PK)
    """

    __tablename__ = "GamePlatform"

    gameId: Mapped[str] = mapped_column(
        String(25), ForeignKey("Game.id", ondelete="CASCADE"), primary_key=True
    )
    platformId: Mapped[str] = mapped_column(
        String(25), ForeignKey("Platform.id", ondelete="CASCADE"), primary_key=True
    )

    # Relationships
    game: Mapped[Game] = relationship("Game", back_populates="platforms")
    platform: Mapped[Platform] = relationship("Platform", back_populates="games")

    # Indexes matching Prisma schema
    __table_args__ = (
        Index("GamePlatform_gameId_idx", "gameId"),
        Index("GamePlatform_platformId_idx", "platformId"),
    )
