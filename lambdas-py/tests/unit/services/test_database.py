"""Unit tests for database service layer.

These tests use mocked SQLAlchemy sessions to test database operations
without requiring a real database connection. All tests are fast and isolated.
"""

from __future__ import annotations

from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.orm import Session

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
from lambdas.services.database import (
    GameData,
    GenreData,
    ImportedGameData,
    LibraryItemData,
    PlatformData,
    create_library_item,
    upsert_game,
    upsert_genre,
    upsert_imported_game,
    upsert_platform,
)

# ==================== Fixtures ====================


@pytest.fixture
def mock_session() -> MagicMock:
    """Create a mocked SQLAlchemy session.

    Returns:
        Mock session with common methods configured.
    """
    session = MagicMock(spec=Session)
    session.add = MagicMock()
    session.flush = MagicMock()
    session.commit = MagicMock()
    session.rollback = MagicMock()
    session.close = MagicMock()
    return session


@pytest.fixture
def imported_game_data() -> ImportedGameData:
    """Create sample ImportedGameData for tests."""
    return ImportedGameData(
        user_id="user123",
        storefront_game_id="730",
        name="Counter-Strike 2",
        storefront=Storefront.STEAM,
        playtime=1200,
        img_icon_url="https://example.com/icon.jpg",
        img_logo_url="https://example.com/logo.jpg",
        igdb_match_status=IgdbMatchStatus.MATCHED,
    )


@pytest.fixture
def genre_data() -> GenreData:
    """Create sample GenreData for tests."""
    return GenreData(
        igdb_id=5,
        name="Shooter",
        slug="shooter",
        checksum="abc123",
    )


@pytest.fixture
def platform_data() -> PlatformData:
    """Create sample PlatformData for tests."""
    return PlatformData(
        igdb_id=6,
        name="PC (Microsoft Windows)",
        slug="win",
        abbreviation="PC",
        alternative_name="Windows",
        generation=None,
        platform_family=1,
        platform_type=1,
        checksum="def456",
    )


@pytest.fixture
def game_data() -> GameData:
    """Create sample GameData for tests."""
    return GameData(
        igdb_id=1020,
        title="The Witcher 3: Wild Hunt",
        slug="the-witcher-3-wild-hunt",
        steam_app_id=292030,
        description="An epic RPG adventure",
        cover_image="https://example.com/cover.jpg",
        release_date=datetime(2015, 5, 19),
        franchise_id=123,
        genre_ids=[5, 12],
        platform_ids=[6, 48],
    )


@pytest.fixture
def library_item_data() -> LibraryItemData:
    """Create sample LibraryItemData for tests."""
    return LibraryItemData(
        user_id="user123",
        game_id="game456",
        playtime=120,
        platform="PC",
    )


# ==================== ImportedGame Tests ====================


def test_upsert_imported_game_creates_new_record(
    mock_session: MagicMock, imported_game_data: ImportedGameData
) -> None:
    """Test that upsert_imported_game creates a new record when none exists."""
    # Mock query to return None (no existing record)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result

    upsert_imported_game(mock_session, imported_game_data)

    # Verify session.add was called with ImportedGame
    assert mock_session.add.called
    added_obj = mock_session.add.call_args[0][0]
    assert isinstance(added_obj, ImportedGame)
    assert added_obj.name == "Counter-Strike 2"
    assert added_obj.storefrontGameId == "730"
    assert added_obj.userId == "user123"
    assert added_obj.playtime == 1200
    assert added_obj.storefront == Storefront.STEAM
    assert added_obj.igdbMatchStatus == IgdbMatchStatus.MATCHED

    # Verify flush was called
    assert mock_session.flush.called


def test_upsert_imported_game_updates_existing_record(
    mock_session: MagicMock, imported_game_data: ImportedGameData
) -> None:
    """Test that upsert_imported_game updates an existing record."""
    # Mock existing ImportedGame
    existing = ImportedGame(
        id="existing123",
        name="Old Name",
        storefront=Storefront.STEAM,
        storefrontGameId="730",
        playtime=600,
        userId="user123",
        igdbMatchStatus=IgdbMatchStatus.PENDING,
        createdAt=datetime(2024, 1, 1),
        updatedAt=datetime(2024, 1, 1),
    )

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing
    mock_session.execute.return_value = mock_result

    result = upsert_imported_game(mock_session, imported_game_data)

    # Verify existing record was updated
    assert result.id == "existing123"
    assert result.name == "Counter-Strike 2"
    assert result.playtime == 1200
    assert result.igdbMatchStatus == IgdbMatchStatus.MATCHED
    assert result.img_icon_url == "https://example.com/icon.jpg"
    assert result.img_logo_url == "https://example.com/logo.jpg"

    # Verify add was NOT called (update only)
    assert not mock_session.add.called


# ==================== Genre Tests ====================


def test_upsert_genre_creates_new_record(
    mock_session: MagicMock, genre_data: GenreData
) -> None:
    """Test that upsert_genre creates a new record when none exists."""
    # Mock query to return None (no existing record)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result

    upsert_genre(mock_session, genre_data)

    # Verify session.add was called with Genre
    assert mock_session.add.called
    added_obj = mock_session.add.call_args[0][0]
    assert isinstance(added_obj, Genre)
    assert added_obj.igdbId == 5
    assert added_obj.name == "Shooter"
    assert added_obj.slug == "shooter"
    assert added_obj.checksum == "abc123"

    # Verify flush was called
    assert mock_session.flush.called


def test_upsert_genre_updates_existing_record(
    mock_session: MagicMock, genre_data: GenreData
) -> None:
    """Test that upsert_genre updates an existing record."""
    # Mock existing Genre
    existing = Genre(
        id="genre123",
        igdbId=5,
        name="Old Shooter",
        slug="old-shooter",
        checksum="old123",
        createdAt=datetime(2024, 1, 1),
        updatedAt=datetime(2024, 1, 1),
    )

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing
    mock_session.execute.return_value = mock_result

    result = upsert_genre(mock_session, genre_data)

    # Verify existing record was updated
    assert result.id == "genre123"
    assert result.name == "Shooter"
    assert result.slug == "shooter"
    assert result.checksum == "abc123"

    # Verify add was NOT called (update only)
    assert not mock_session.add.called


# ==================== Platform Tests ====================


def test_upsert_platform_creates_new_record(
    mock_session: MagicMock, platform_data: PlatformData
) -> None:
    """Test that upsert_platform creates a new record when none exists."""
    # Mock query to return None (no existing record)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result

    upsert_platform(mock_session, platform_data)

    # Verify session.add was called with Platform
    assert mock_session.add.called
    added_obj = mock_session.add.call_args[0][0]
    assert isinstance(added_obj, Platform)
    assert added_obj.igdbId == 6
    assert added_obj.name == "PC (Microsoft Windows)"
    assert added_obj.slug == "win"
    assert added_obj.abbreviation == "PC"
    assert added_obj.alternativeName == "Windows"
    assert added_obj.checksum == "def456"

    # Verify flush was called
    assert mock_session.flush.called


def test_upsert_platform_updates_existing_record(
    mock_session: MagicMock, platform_data: PlatformData
) -> None:
    """Test that upsert_platform updates an existing record."""
    # Mock existing Platform
    existing = Platform(
        id="platform123",
        igdbId=6,
        name="Old PC",
        slug="old-pc",
        abbreviation="PC",
        createdAt=datetime(2024, 1, 1),
        updatedAt=datetime(2024, 1, 1),
    )

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing
    mock_session.execute.return_value = mock_result

    result = upsert_platform(mock_session, platform_data)

    # Verify existing record was updated
    assert result.id == "platform123"
    assert result.name == "PC (Microsoft Windows)"
    assert result.slug == "win"
    assert result.abbreviation == "PC"
    assert result.alternativeName == "Windows"
    assert result.checksum == "def456"

    # Verify add was NOT called (update only)
    assert not mock_session.add.called


# ==================== Game Tests ====================


def test_upsert_game_creates_new_record_with_igdb_match(
    mock_session: MagicMock, game_data: GameData
) -> None:
    """Test that upsert_game creates a new record when matched by igdbId."""
    # Mock query to return None for both igdbId and steamAppId queries
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result

    # Mock query for deleting existing relationships (returns nothing to delete)
    mock_session.query.return_value.filter.return_value.delete.return_value = 0

    # Mock query for fetching genres and platforms
    mock_genres_result = MagicMock()
    mock_genres_result.scalars.return_value.all.return_value = [
        Genre(id="genre1", igdbId=5, name="RPG", slug="rpg"),
        Genre(id="genre2", igdbId=12, name="Adventure", slug="adventure"),
    ]

    mock_platforms_result = MagicMock()
    mock_platforms_result.scalars.return_value.all.return_value = [
        Platform(id="platform1", igdbId=6, name="PC", slug="pc"),
        Platform(id="platform2", igdbId=48, name="PlayStation 4", slug="ps4"),
    ]

    # Configure execute to return different results based on query
    def side_effect(*args: tuple[object, ...]) -> MagicMock:
        # Check if this is a Genre or Platform query
        if args and hasattr(args[0], "column_descriptions"):
            # Iterate over actual column descriptions, not string characters
            for col in args[0].column_descriptions:
                # Check column name or string representation for Genre/Platform
                col_str = str(col)
                # Try to get column name from dict or tuple/list
                col_name = None
                if isinstance(col, dict):
                    col_name = col.get("name") or col.get("entity")
                elif isinstance(col, (tuple, list)) and len(col) > 0:
                    col_name = col[0]
                
                # Check column name or string representation for Genre
                check_str = str(col_name) if col_name else col_str
                if "Genre" in check_str:
                    return mock_genres_result
                
                # Check column name or string representation for Platform
                if "Platform" in check_str:
                    return mock_platforms_result
        return mock_result

    mock_session.execute.side_effect = side_effect

    upsert_game(mock_session, game_data)

    # Verify session.add was called with Game
    assert mock_session.add.called
    game_calls = [call for call in mock_session.add.call_args_list if isinstance(call[0][0], Game)]
    assert len(game_calls) > 0
    added_game = game_calls[0][0][0]
    assert added_game.igdbId == 1020
    assert added_game.title == "The Witcher 3: Wild Hunt"
    assert added_game.slug == "the-witcher-3-wild-hunt"
    assert added_game.steamAppId == 292030
    assert added_game.description == "An epic RPG adventure"

    # Verify flush was called
    assert mock_session.flush.called


def test_upsert_game_matches_by_steam_app_id_fallback(
    mock_session: MagicMock, game_data: GameData
) -> None:
    """Test that upsert_game falls back to steamAppId when igdbId doesn't match."""
    # Mock existing Game (matched by steamAppId)
    existing = Game(
        id="game123",
        igdbId=999,
        steamAppId=292030,
        title="Old Title",
        slug="old-slug",
        createdAt=datetime(2024, 1, 1),
        updatedAt=datetime(2024, 1, 1),
    )

    # First query (igdbId) returns None, second query (steamAppId) returns existing
    mock_result_none = MagicMock()
    mock_result_none.scalar_one_or_none.return_value = None

    mock_result_existing = MagicMock()
    mock_result_existing.scalar_one_or_none.return_value = existing

    call_count = 0

    def side_effect(*args: tuple[object, ...]) -> MagicMock:
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return mock_result_none
        elif call_count == 2:
            return mock_result_existing
        # For genre/platform queries
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        return mock_result

    mock_session.execute.side_effect = side_effect

    # Mock query for deleting existing relationships
    mock_session.query.return_value.filter.return_value.delete.return_value = 0

    result = upsert_game(mock_session, game_data)

    # Verify existing record was updated with new igdbId
    assert result.id == "game123"
    assert result.igdbId == 1020
    assert result.title == "The Witcher 3: Wild Hunt"
    assert result.steamAppId == 292030

    # Verify add was NOT called (update only)
    game_add_calls = [
        call for call in mock_session.add.call_args_list if isinstance(call[0][0], Game)
    ]
    assert len(game_add_calls) == 0


def test_upsert_game_updates_existing_record(
    mock_session: MagicMock, game_data: GameData
) -> None:
    """Test that upsert_game updates an existing record matched by igdbId."""
    # Mock existing Game
    existing = Game(
        id="game123",
        igdbId=1020,
        steamAppId=292030,
        title="Old Title",
        slug="old-slug",
        createdAt=datetime(2024, 1, 1),
        updatedAt=datetime(2024, 1, 1),
    )

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing

    # For genre/platform queries
    mock_empty_result = MagicMock()
    mock_empty_result.scalars.return_value.all.return_value = []

    call_count = 0

    def side_effect(*args: tuple[object, ...]) -> MagicMock:
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return mock_result
        return mock_empty_result

    mock_session.execute.side_effect = side_effect

    # Mock query for deleting existing relationships
    mock_session.query.return_value.filter.return_value.delete.return_value = 0

    result = upsert_game(mock_session, game_data)

    # Verify existing record was updated
    assert result.id == "game123"
    assert result.title == "The Witcher 3: Wild Hunt"
    assert result.slug == "the-witcher-3-wild-hunt"
    assert result.description == "An epic RPG adventure"

    # Verify add was NOT called for Game (update only)
    game_add_calls = [
        call for call in mock_session.add.call_args_list if isinstance(call[0][0], Game)
    ]
    assert len(game_add_calls) == 0


# ==================== LibraryItem Tests ====================


def test_create_library_item_with_zero_playtime_sets_curious_about(
    mock_session: MagicMock,
) -> None:
    """Test that create_library_item sets status to CURIOUS_ABOUT when playtime is 0."""
    data = LibraryItemData(
        user_id="user123",
        game_id="game456",
        playtime=0,
        platform="PC",
    )

    # Mock query to return None (no existing library item)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result

    create_library_item(mock_session, data)

    # Verify session.add was called with LibraryItem
    assert mock_session.add.called
    added_obj = mock_session.add.call_args[0][0]
    assert isinstance(added_obj, LibraryItem)
    assert added_obj.userId == "user123"
    assert added_obj.gameId == "game456"
    assert added_obj.status == LibraryItemStatus.CURIOUS_ABOUT
    assert added_obj.platform == "PC"

    # Verify flush was called
    assert mock_session.flush.called


def test_create_library_item_with_nonzero_playtime_sets_experienced(
    mock_session: MagicMock, library_item_data: LibraryItemData
) -> None:
    """Test that create_library_item sets status to EXPERIENCED when playtime > 0."""
    # Mock query to return None (no existing library item)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result

    create_library_item(mock_session, library_item_data)

    # Verify session.add was called with LibraryItem
    assert mock_session.add.called
    added_obj = mock_session.add.call_args[0][0]
    assert isinstance(added_obj, LibraryItem)
    assert added_obj.userId == "user123"
    assert added_obj.gameId == "game456"
    assert added_obj.status == LibraryItemStatus.EXPERIENCED
    assert added_obj.platform == "PC"

    # Verify flush was called
    assert mock_session.flush.called


def test_create_library_item_raises_error_if_duplicate_exists(
    mock_session: MagicMock, library_item_data: LibraryItemData
) -> None:
    """Test that create_library_item raises ValueError if library item already exists."""
    # Mock existing LibraryItem
    existing = LibraryItem(
        id=1,
        userId="user123",
        gameId="game456",
        status=LibraryItemStatus.CURIOUS_ABOUT,
        createdAt=datetime(2024, 1, 1),
        updatedAt=datetime(2024, 1, 1),
    )

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing
    mock_session.execute.return_value = mock_result

    with pytest.raises(ValueError, match="LibraryItem already exists"):
        create_library_item(mock_session, library_item_data)

    # Verify add was NOT called
    assert not mock_session.add.called


# ==================== Edge Cases ====================


def test_upsert_game_with_no_genres_or_platforms(mock_session: MagicMock) -> None:
    """Test that upsert_game works without genres or platforms."""
    data = GameData(
        igdb_id=1020,
        title="Simple Game",
        slug="simple-game",
        genre_ids=[],
        platform_ids=[],
    )

    # Mock query to return None (no existing record)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result

    upsert_game(mock_session, data)

    # Verify session.add was called with Game
    assert mock_session.add.called
    game_calls = [call for call in mock_session.add.call_args_list if isinstance(call[0][0], Game)]
    assert len(game_calls) > 0

    # Verify no genre/platform relationships were created
    genre_calls = [
        call for call in mock_session.add.call_args_list if isinstance(call[0][0], GameGenre)
    ]
    platform_calls = [
        call for call in mock_session.add.call_args_list if isinstance(call[0][0], GamePlatform)
    ]
    assert len(genre_calls) == 0
    assert len(platform_calls) == 0


def test_pydantic_validation_for_invalid_data() -> None:
    """Test that Pydantic models reject invalid data."""
    # Invalid igdb_id (must be > 0)
    with pytest.raises(ValueError):
        GenreData(igdb_id=-1, name="Test", slug="test")

    # Invalid user_id (empty string)
    with pytest.raises(ValueError):
        ImportedGameData(
            user_id="",
            storefront_game_id="123",
            name="Test",
            storefront=Storefront.STEAM,
        )

    # Invalid playtime (negative)
    with pytest.raises(ValueError):
        LibraryItemData(
            user_id="user123",
            game_id="game456",
            playtime=-10,
        )


def test_game_data_validator_handles_none_genre_ids() -> None:
    """Test that GameData validator converts None to empty list for genre_ids."""
    data = GameData(
        igdb_id=1020,
        title="Test Game",
        slug="test-game",
        genre_ids=None,  # type: ignore[arg-type]
        platform_ids=None,  # type: ignore[arg-type]
    )
    assert data.genre_ids == []
    assert data.platform_ids == []


def test_game_data_validator_rejects_non_list() -> None:
    """Test that GameData validator rejects non-list values for genre_ids."""
    with pytest.raises(TypeError, match="Expected list"):
        GameData(
            igdb_id=1020,
            title="Test Game",
            slug="test-game",
            genre_ids="not a list",  # type: ignore[arg-type]
        )


# ==================== Session Management Tests ====================


@patch("lambdas.services.database.create_engine")
@patch("lambdas.services.database.get_settings")
def test_get_engine_creates_engine_with_correct_settings(
    mock_get_settings: MagicMock, mock_create_engine: MagicMock
) -> None:
    """Test that _get_engine creates SQLAlchemy engine with correct configuration."""
    # Reset global engine
    import lambdas.services.database
    from lambdas.services.database import _get_engine

    lambdas.services.database._engine = None

    # Mock settings
    mock_settings = MagicMock()
    mock_settings.database_url = "postgresql://user:pass@localhost:5432/db"
    mock_get_settings.return_value = mock_settings

    # Mock engine
    mock_engine = MagicMock()
    mock_create_engine.return_value = mock_engine

    result = _get_engine()

    # Verify create_engine was called with correct arguments
    mock_create_engine.assert_called_once_with(
        "postgresql://user:pass@localhost:5432/db",
        pool_size=2,
        max_overflow=3,
        pool_pre_ping=True,
        echo=False,
    )

    assert result == mock_engine


@patch("lambdas.services.database._get_session_factory")
def test_get_session_context_manager_commits_on_success(
    mock_get_factory: MagicMock,
) -> None:
    """Test that get_session context manager commits transaction on success."""
    from lambdas.services.database import get_session

    # Mock session factory
    mock_session = MagicMock()
    mock_factory = MagicMock()
    mock_factory.return_value = mock_session
    mock_get_factory.return_value = mock_factory

    with get_session() as session:
        assert session == mock_session

    # Verify commit and close were called
    mock_session.commit.assert_called_once()
    mock_session.close.assert_called_once()
    mock_session.rollback.assert_not_called()


@patch("lambdas.services.database._get_session_factory")
def test_get_session_context_manager_rolls_back_on_error(
    mock_get_factory: MagicMock,
) -> None:
    """Test that get_session context manager rolls back transaction on error."""
    from lambdas.services.database import get_session

    # Mock session factory
    mock_session = MagicMock()
    mock_factory = MagicMock()
    mock_factory.return_value = mock_session
    mock_get_factory.return_value = mock_factory

    with pytest.raises(RuntimeError), get_session():
        raise RuntimeError("Test error")

    # Verify rollback and close were called
    mock_session.rollback.assert_called_once()
    mock_session.close.assert_called_once()
    mock_session.commit.assert_not_called()
