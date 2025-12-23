"""Unit tests for Lambda 3: database_import handler.

These tests verify the database import logic including:
- Event validation with Pydantic
- CSV parsing from enriched format
- Statistics tracking (created vs updated)
- Import logic for MATCHED and UNMATCHED games
- Playtime-based status determination
- Error handling for S3, validation, and database errors
"""

from __future__ import annotations

from unittest.mock import MagicMock, Mock, patch

import pytest
from pydantic import ValidationError
from sqlalchemy.orm import Session

from lambdas.errors import S3Error
from lambdas.handlers.database_import import (
    DatabaseImportEvent,
    DatabaseImportResponse,
    EnrichedCsvRow,
    ImportStats,
    _import_enriched_csv,
    _import_row,
    _parse_enriched_csv,
    _parse_s3_uri,
    handler,
)
from lambdas.models.db import (
    IgdbMatchStatus,
    LibraryItemStatus,
)
from lambdas.services.database import (
    ImportedGameData,
    LibraryItemData,
)

# ==================== Fixtures ====================


@pytest.fixture
def valid_event() -> dict[str, str]:
    """Fixture for a valid Lambda event."""
    return {
        "user_id": "user123",
        "s3_enriched_location": "s3://test-bucket/imports/user123/20240101120000-enriched.csv",
    }


@pytest.fixture
def sample_enriched_csv_matched() -> str:
    """Fixture for enriched CSV with MATCHED games."""
    return """steam_app_id,name,playtime,igdb_id,igdb_title,igdb_slug,igdb_description,igdb_cover_image,igdb_release_date,igdb_franchise_id,igdb_genres,igdb_platforms,match_status
570,Dota 2,15000,119,Dota 2,dota-2,A popular MOBA game,https://images.igdb.com/cover.jpg,2013-07-09,null,5,6,MATCHED
730,Counter-Strike 2,5000,80,Counter-Strike 2,counter-strike-2,Tactical FPS,https://images.igdb.com/cs2.jpg,2023-09-27,null,5,6,MATCHED"""


@pytest.fixture
def sample_enriched_csv_unmatched() -> str:
    """Fixture for enriched CSV with UNMATCHED games."""
    return """steam_app_id,name,playtime,igdb_id,igdb_title,igdb_slug,igdb_description,igdb_cover_image,igdb_release_date,igdb_franchise_id,igdb_genres,igdb_platforms,match_status
440,Team Fortress 2,567,null,null,null,null,null,null,null,null,null,UNMATCHED"""


@pytest.fixture
def sample_enriched_csv_mixed() -> str:
    """Fixture for enriched CSV with mixed match statuses."""
    return """steam_app_id,name,playtime,igdb_id,igdb_title,igdb_slug,igdb_description,igdb_cover_image,igdb_release_date,igdb_franchise_id,igdb_genres,igdb_platforms,match_status
570,Dota 2,15000,119,Dota 2,dota-2,A popular MOBA game,https://images.igdb.com/cover.jpg,2013-07-09,null,5,6,MATCHED
440,Team Fortress 2,0,null,null,null,null,null,null,null,null,null,UNMATCHED
1091500,Cyberpunk 2077,8000,1877,Cyberpunk 2077,cyberpunk-2077,Sci-fi RPG,https://images.igdb.com/cp2077.jpg,2020-12-10,null,12,6,MATCHED"""


@pytest.fixture
def sample_enriched_csv_with_genres_platforms() -> str:
    """Fixture for enriched CSV with genres and platforms."""
    return """steam_app_id,name,playtime,igdb_id,igdb_title,igdb_slug,igdb_description,igdb_cover_image,igdb_release_date,igdb_franchise_id,igdb_genres,igdb_platforms,match_status
570,Dota 2,15000,119,Dota 2,dota-2,A popular MOBA game,https://images.igdb.com/cover.jpg,2013-07-09,null,"5,12,31","6,14",MATCHED"""


@pytest.fixture
def mock_session() -> Mock:
    """Fixture for mocked SQLAlchemy session."""
    session = Mock(spec=Session)
    session.execute = Mock()
    session.add = Mock()
    session.flush = Mock()
    session.commit = Mock()
    session.rollback = Mock()
    session.close = Mock()
    return session


@pytest.fixture
def mock_s3_client() -> Mock:
    """Fixture for mocked S3Client."""
    client = Mock()
    client.download_csv = Mock(return_value="mock,csv,content")
    return client


# ==================== Event Validation Tests ====================


def test_database_import_event_valid() -> None:
    """Test DatabaseImportEvent with valid data."""
    event = DatabaseImportEvent(
        user_id="user123",
        s3_enriched_location="s3://bucket/imports/user123/enriched.csv",
    )

    assert event.user_id == "user123"
    assert event.s3_enriched_location == "s3://bucket/imports/user123/enriched.csv"


def test_database_import_event_invalid_s3_uri() -> None:
    """Test DatabaseImportEvent rejects invalid S3 URI."""
    with pytest.raises(ValidationError, match="must start with 's3://'"):
        DatabaseImportEvent(
            user_id="user123",
            s3_enriched_location="https://example.com/file.csv",
        )


def test_database_import_event_missing_bucket() -> None:
    """Test DatabaseImportEvent rejects S3 URI without bucket."""
    with pytest.raises(ValidationError, match="Invalid S3 URI"):
        DatabaseImportEvent(
            user_id="user123",
            s3_enriched_location="s3:///file.csv",
        )


def test_database_import_event_empty_user_id() -> None:
    """Test DatabaseImportEvent rejects empty user_id."""
    with pytest.raises(ValidationError):
        DatabaseImportEvent(
            user_id="",
            s3_enriched_location="s3://bucket/key.csv",
        )


# ==================== CSV Parsing Tests ====================


def test_enriched_csv_row_valid() -> None:
    """Test EnrichedCsvRow parsing with valid data."""
    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=15000,
        igdb_id=119,
        igdb_title="Dota 2",
        igdb_slug="dota-2",
        igdb_description="A popular MOBA",
        igdb_cover_image="https://images.igdb.com/cover.jpg",
        igdb_release_date="2013-07-09",
        igdb_franchise_id=None,
        igdb_genres="5,12",
        igdb_platforms="6",
        match_status=IgdbMatchStatus.MATCHED,
    )

    assert row.steam_app_id == "570"
    assert row.igdb_id == 119
    assert row.match_status == IgdbMatchStatus.MATCHED


def test_enriched_csv_row_empty_strings_to_none() -> None:
    """Test EnrichedCsvRow converts empty strings to None."""
    row = EnrichedCsvRow(
        steam_app_id="440",
        name="Team Fortress 2",
        playtime=0,
        igdb_id="",
        igdb_title="",
        igdb_slug="",
        igdb_description="",
        igdb_cover_image="",
        igdb_release_date="",
        igdb_franchise_id="",
        igdb_genres="",
        igdb_platforms="",
        match_status=IgdbMatchStatus.UNMATCHED,
    )

    assert row.igdb_id is None
    assert row.igdb_title is None
    assert row.igdb_genres is None


def test_enriched_csv_row_parse_genre_ids() -> None:
    """Test parsing comma-separated genre IDs."""
    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=15000,
        igdb_genres="5,12,31",
        match_status=IgdbMatchStatus.MATCHED,
    )

    genre_ids = row.parse_genre_ids()
    assert genre_ids == [5, 12, 31]


def test_enriched_csv_row_parse_platform_ids() -> None:
    """Test parsing comma-separated platform IDs."""
    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=15000,
        igdb_platforms="6,14",
        match_status=IgdbMatchStatus.MATCHED,
    )

    platform_ids = row.parse_platform_ids()
    assert platform_ids == [6, 14]


def test_enriched_csv_row_parse_empty_genres() -> None:
    """Test parsing empty genre string returns empty list."""
    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=15000,
        igdb_genres="",
        match_status=IgdbMatchStatus.MATCHED,
    )

    genre_ids = row.parse_genre_ids()
    assert genre_ids == []


def test_enriched_csv_row_parse_genre_ids_with_textual_names() -> None:
    """Test parsing genre IDs tolerates both numeric IDs and textual names."""
    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=15000,
        igdb_genres="5,Action,12,RPG",
        match_status=IgdbMatchStatus.MATCHED,
    )

    genre_values = row.parse_genre_ids()
    # Should return mixed list: ints for numeric values, strings for names
    assert genre_values == [5, "Action", 12, "RPG"]


def test_enriched_csv_row_parse_platform_ids_with_textual_names() -> None:
    """Test parsing platform IDs tolerates both numeric IDs and textual names."""
    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=15000,
        igdb_platforms="6,PC,14,PlayStation 5",
        match_status=IgdbMatchStatus.MATCHED,
    )

    platform_values = row.parse_platform_ids()
    # Should return mixed list: ints for numeric values, strings for names
    assert platform_values == [6, "PC", 14, "PlayStation 5"]


def test_enriched_csv_row_parse_genre_ids_only_textual_names() -> None:
    """Test parsing genre IDs with only textual names."""
    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=15000,
        igdb_genres="Action,RPG,Strategy",
        match_status=IgdbMatchStatus.MATCHED,
    )

    genre_values = row.parse_genre_ids()
    assert genre_values == ["Action", "RPG", "Strategy"]


def test_enriched_csv_row_parse_platform_ids_only_textual_names() -> None:
    """Test parsing platform IDs with only textual names."""
    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=15000,
        igdb_platforms="PC,PlayStation 5,Xbox Series X",
        match_status=IgdbMatchStatus.MATCHED,
    )

    platform_values = row.parse_platform_ids()
    assert platform_values == ["PC", "PlayStation 5", "Xbox Series X"]


def test_enriched_csv_row_parse_release_date() -> None:
    """Test parsing release date string to datetime."""
    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=15000,
        igdb_release_date="2013-07-09",
        match_status=IgdbMatchStatus.MATCHED,
    )

    release_date = row.parse_release_date()
    assert release_date is not None
    assert release_date.year == 2013
    assert release_date.month == 7
    assert release_date.day == 9


def test_parse_s3_uri_valid() -> None:
    """Test parsing valid S3 URI."""
    bucket, key = _parse_s3_uri("s3://my-bucket/imports/user123/file.csv")

    assert bucket == "my-bucket"
    assert key == "imports/user123/file.csv"


def test_parse_s3_uri_invalid() -> None:
    """Test parsing invalid S3 URI raises ValueError."""
    with pytest.raises(ValueError, match="Invalid S3 URI"):
        _parse_s3_uri("s3://")


def test_parse_enriched_csv_valid(sample_enriched_csv_matched: str) -> None:
    """Test parsing valid enriched CSV."""
    rows = _parse_enriched_csv(sample_enriched_csv_matched)

    assert len(rows) == 2
    assert rows[0].steam_app_id == "570"
    assert rows[0].name == "Dota 2"
    assert rows[0].igdb_id == 119
    assert rows[0].match_status == IgdbMatchStatus.MATCHED
    assert rows[1].steam_app_id == "730"


def test_parse_enriched_csv_empty() -> None:
    """Test parsing empty CSV returns empty list."""
    csv_content = "steam_app_id,name,playtime,match_status\n"
    rows = _parse_enriched_csv(csv_content)

    assert rows == []


def test_parse_enriched_csv_invalid_row_skipped() -> None:
    """Test parsing CSV with invalid row skips that row."""
    csv_content = """steam_app_id,name,playtime,match_status
570,Dota 2,15000,MATCHED
,Invalid Row,abc,INVALID
730,Valid Game,5000,MATCHED"""

    rows = _parse_enriched_csv(csv_content)

    # Should skip the invalid row
    assert len(rows) == 2
    assert rows[0].steam_app_id == "570"
    assert rows[1].steam_app_id == "730"


def test_enriched_csv_row_filtered_status_mapped_to_ignored() -> None:
    """Test FILTERED status is mapped to IGNORED enum."""
    row = EnrichedCsvRow(
        steam_app_id="440",
        name="Team Fortress 2",
        playtime=0,
        match_status="filtered",  # Lowercase FILTERED
    )

    assert row.match_status == IgdbMatchStatus.IGNORED


def test_enriched_csv_row_error_status_mapped_to_unmatched() -> None:
    """Test ERROR status is mapped to UNMATCHED enum."""
    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=15000,
        match_status="error",  # Lowercase ERROR
    )

    assert row.match_status == IgdbMatchStatus.UNMATCHED


def test_enriched_csv_row_invalid_status_defaults_to_unmatched() -> None:
    """Test invalid status defaults to UNMATCHED enum."""
    row = EnrichedCsvRow(
        steam_app_id="730",
        name="Counter-Strike 2",
        playtime=5000,
        match_status="INVALID_STATUS",  # Unknown status
    )

    assert row.match_status == IgdbMatchStatus.UNMATCHED


def test_parse_enriched_csv_with_filtered_status() -> None:
    """Test parsing CSV with FILTERED status maps to IGNORED."""
    csv_content = """appid,name,playtime_forever,match_status
440,Team Fortress 2,0,filtered
570,Dota 2,15000,matched"""

    rows = _parse_enriched_csv(csv_content)

    assert len(rows) == 2
    assert rows[0].match_status == IgdbMatchStatus.IGNORED
    assert rows[1].match_status == IgdbMatchStatus.MATCHED


def test_parse_enriched_csv_with_error_status() -> None:
    """Test parsing CSV with ERROR status maps to UNMATCHED."""
    csv_content = """appid,name,playtime_forever,match_status
570,Dota 2,15000,error
440,Team Fortress 2,0,unmatched"""

    rows = _parse_enriched_csv(csv_content)

    assert len(rows) == 2
    assert rows[0].match_status == IgdbMatchStatus.UNMATCHED
    assert rows[1].match_status == IgdbMatchStatus.UNMATCHED


# ==================== Import Logic Tests ====================


@patch("lambdas.handlers.database_import.upsert_imported_game")
@patch("lambdas.handlers.database_import._check_record_exists")
def test_import_row_unmatched_game(
    mock_check_exists: Mock,
    mock_upsert_imported_game: Mock,
    mock_session: Mock,
) -> None:
    """Test importing UNMATCHED game creates only ImportedGame."""
    mock_check_exists.return_value = False
    mock_imported_game = Mock()
    mock_imported_game.id = "imported123"
    mock_upsert_imported_game.return_value = mock_imported_game

    row = EnrichedCsvRow(
        steam_app_id="440",
        name="Team Fortress 2",
        playtime=567,
        match_status=IgdbMatchStatus.UNMATCHED,
    )

    stats = ImportStats()

    _import_row(mock_session, row, "user123", stats)

    # Should create ImportedGame
    mock_upsert_imported_game.assert_called_once()
    call_args = mock_upsert_imported_game.call_args[0]
    imported_game_data = call_args[1]
    assert isinstance(imported_game_data, ImportedGameData)
    assert imported_game_data.storefront_game_id == "440"
    assert imported_game_data.igdb_match_status == IgdbMatchStatus.UNMATCHED

    # Should increment created count
    assert stats.imported_games_created == 1
    assert stats.games_created == 0
    assert stats.library_items_created == 0


@patch("lambdas.handlers.database_import.create_library_item")
@patch("lambdas.handlers.database_import.upsert_game")
@patch("lambdas.handlers.database_import.upsert_genre")
@patch("lambdas.handlers.database_import.upsert_platform")
@patch("lambdas.handlers.database_import.upsert_imported_game")
@patch("lambdas.handlers.database_import._check_record_exists")
def test_import_row_matched_game_creates_library_item(
    mock_check_exists: Mock,
    mock_upsert_imported_game: Mock,
    mock_upsert_platform: Mock,
    mock_upsert_genre: Mock,
    mock_upsert_game: Mock,
    mock_create_library_item: Mock,
    mock_session: Mock,
) -> None:
    """Test importing MATCHED game creates Game and LibraryItem."""
    # Mock ImportedGame exists, Game doesn't exist
    mock_check_exists.side_effect = [True, False]

    mock_imported_game = Mock()
    mock_imported_game.id = "imported123"
    mock_upsert_imported_game.return_value = mock_imported_game

    mock_game = Mock()
    mock_game.id = "game123"
    mock_upsert_game.return_value = mock_game

    mock_library_item = Mock()
    mock_library_item.id = "library123"
    mock_library_item.status = LibraryItemStatus.EXPERIENCED
    mock_create_library_item.return_value = mock_library_item

    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=15000,
        igdb_id=119,
        igdb_title="Dota 2",
        igdb_slug="dota-2",
        igdb_genres="5,12",
        igdb_platforms="6",
        match_status=IgdbMatchStatus.MATCHED,
    )

    stats = ImportStats()

    _import_row(mock_session, row, "user123", stats)

    # Should upsert ImportedGame
    mock_upsert_imported_game.assert_called_once()

    # Should upsert genres
    assert mock_upsert_genre.call_count == 2

    # Should upsert platforms
    assert mock_upsert_platform.call_count == 1

    # Should upsert Game
    mock_upsert_game.assert_called_once()

    # Should create LibraryItem
    mock_create_library_item.assert_called_once()
    call_args = mock_create_library_item.call_args[0]
    library_item_data = call_args[1]
    assert isinstance(library_item_data, LibraryItemData)
    assert library_item_data.user_id == "user123"
    assert library_item_data.game_id == "game123"
    assert library_item_data.playtime == 15000

    # Should increment stats
    assert stats.imported_games_updated == 1
    assert stats.games_created == 1
    assert stats.library_items_created == 1


@patch("lambdas.handlers.database_import.get_logger")
@patch("lambdas.handlers.database_import.create_library_item")
@patch("lambdas.handlers.database_import.upsert_game")
@patch("lambdas.handlers.database_import.upsert_genre")
@patch("lambdas.handlers.database_import.upsert_platform")
@patch("lambdas.handlers.database_import.upsert_imported_game")
@patch("lambdas.handlers.database_import._check_record_exists")
def test_import_row_filters_textual_names_and_logs_warning(
    mock_check_exists: Mock,
    mock_upsert_imported_game: Mock,
    mock_upsert_platform: Mock,
    mock_upsert_genre: Mock,
    mock_upsert_game: Mock,
    mock_create_library_item: Mock,
    mock_get_logger: Mock,
    mock_session: Mock,
) -> None:
    """Test importing MATCHED game filters out textual names and logs warnings."""
    mock_check_exists.side_effect = [False, False]

    mock_imported_game = Mock()
    mock_imported_game.id = "imported123"
    mock_upsert_imported_game.return_value = mock_imported_game

    mock_game = Mock()
    mock_game.id = "game123"
    mock_upsert_game.return_value = mock_game

    mock_library_item = Mock()
    mock_library_item.id = "library123"
    mock_create_library_item.return_value = mock_library_item

    mock_logger = Mock()
    mock_get_logger.return_value = mock_logger

    # Row with mixed numeric IDs and textual names
    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=15000,
        igdb_id=119,
        igdb_title="Dota 2",
        igdb_slug="dota-2",
        igdb_genres="5,Action,12,RPG",  # Mixed: 5,12 are ints; Action,RPG are strings
        igdb_platforms="6,PC,14",  # Mixed: 6,14 are ints; PC is string
        match_status=IgdbMatchStatus.MATCHED,
    )

    stats = ImportStats()

    _import_row(mock_session, row, "user123", stats)

    # Should log warnings for textual names
    assert mock_logger.warning.call_count == 2

    # Check genre warning
    genre_warning_call = mock_logger.warning.call_args_list[0]
    assert "genre names" in genre_warning_call[0][0].lower()
    assert genre_warning_call[1]["genre_names"] == ["Action", "RPG"]
    assert genre_warning_call[1]["genre_ids"] == [5, 12]

    # Check platform warning
    platform_warning_call = mock_logger.warning.call_args_list[1]
    assert "platform names" in platform_warning_call[0][0].lower()
    assert platform_warning_call[1]["platform_names"] == ["PC"]
    assert platform_warning_call[1]["platform_ids"] == [6, 14]

    # Should only upsert genres with integer IDs (2 calls for IDs 5 and 12)
    assert mock_upsert_genre.call_count == 2
    # Verify only int IDs are passed
    for call in mock_upsert_genre.call_args_list:
        genre_data = call[0][1]
        assert isinstance(genre_data.igdb_id, int)

    # Should only upsert platforms with integer IDs (2 calls for IDs 6 and 14)
    assert mock_upsert_platform.call_count == 2
    # Verify only int IDs are passed
    for call in mock_upsert_platform.call_args_list:
        platform_data = call[0][1]
        assert isinstance(platform_data.igdb_id, int)

    # Should upsert Game with only integer IDs
    mock_upsert_game.assert_called_once()
    game_data = mock_upsert_game.call_args[0][1]
    assert game_data.genre_ids == [5, 12]  # Only ints
    assert game_data.platform_ids == [6, 14]  # Only ints


@patch("lambdas.handlers.database_import.create_library_item")
@patch("lambdas.handlers.database_import.upsert_game")
@patch("lambdas.handlers.database_import.upsert_imported_game")
@patch("lambdas.handlers.database_import._check_record_exists")
def test_import_row_matched_game_duplicate_library_item_skipped(
    mock_check_exists: Mock,
    mock_upsert_imported_game: Mock,
    mock_upsert_game: Mock,
    mock_create_library_item: Mock,
    mock_session: Mock,
) -> None:
    """Test importing MATCHED game skips duplicate LibraryItem."""
    mock_check_exists.side_effect = [False, False]

    mock_imported_game = Mock()
    mock_imported_game.id = "imported123"
    mock_upsert_imported_game.return_value = mock_imported_game

    mock_game = Mock()
    mock_game.id = "game123"
    mock_upsert_game.return_value = mock_game

    # LibraryItem creation raises ValueError (duplicate)
    mock_create_library_item.side_effect = ValueError("LibraryItem already exists")

    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=15000,
        igdb_id=119,
        igdb_title="Dota 2",
        igdb_slug="dota-2",
        match_status=IgdbMatchStatus.MATCHED,
    )

    stats = ImportStats()

    _import_row(mock_session, row, "user123", stats)

    # Should attempt to create LibraryItem
    mock_create_library_item.assert_called_once()

    # Should NOT increment library_items_created
    assert stats.library_items_created == 0


@patch("lambdas.handlers.database_import.upsert_imported_game")
@patch("lambdas.handlers.database_import._check_record_exists")
def test_import_row_matched_without_igdb_id_skips_game_import(
    mock_check_exists: Mock,
    mock_upsert_imported_game: Mock,
    mock_session: Mock,
) -> None:
    """Test MATCHED status without igdb_id skips Game import."""
    mock_check_exists.return_value = False

    mock_imported_game = Mock()
    mock_imported_game.id = "imported123"
    mock_upsert_imported_game.return_value = mock_imported_game

    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=15000,
        igdb_id=None,  # Missing igdb_id
        match_status=IgdbMatchStatus.MATCHED,
    )

    stats = ImportStats()

    _import_row(mock_session, row, "user123", stats)

    # Should only create ImportedGame
    mock_upsert_imported_game.assert_called_once()
    assert stats.imported_games_created == 1
    assert stats.games_created == 0


# ==================== Handler Tests ====================


@patch("lambdas.handlers.database_import._import_enriched_csv")
def test_handler_valid_event(mock_import: Mock, valid_event: dict[str, str]) -> None:
    """Test handler with valid event."""
    mock_import.return_value = DatabaseImportResponse(
        success=True,
        stats=ImportStats(
            imported_games_created=10,
            games_created=8,
            library_items_created=8,
        ),
    )

    result = handler(valid_event, None)

    assert result["success"] is True
    assert result["stats"]["imported_games_created"] == 10
    mock_import.assert_called_once()


def test_handler_invalid_event() -> None:
    """Test handler with invalid event."""
    invalid_event = {
        "user_id": "",  # Invalid: empty user_id
        "s3_enriched_location": "invalid-uri",
    }

    result = handler(invalid_event, None)

    assert result["success"] is False
    assert "Invalid input" in result["error"]


@patch("lambdas.handlers.database_import._import_enriched_csv")
def test_handler_unexpected_error(mock_import: Mock, valid_event: dict[str, str]) -> None:
    """Test handler handles unexpected errors."""
    mock_import.side_effect = RuntimeError("Unexpected error")

    result = handler(valid_event, None)

    assert result["success"] is False
    assert "Unexpected error" in result["error"]


# ==================== Integration Tests ====================


@patch("lambdas.handlers.database_import.get_settings")
@patch("lambdas.handlers.database_import.get_session")
@patch("lambdas.handlers.database_import.S3Client")
def test_import_enriched_csv_success(
    mock_s3_client_class: Mock,
    mock_get_session: Mock,
    mock_get_settings: Mock,
    sample_enriched_csv_matched: str,
) -> None:
    """Test successful CSV import from S3."""
    # Mock settings
    mock_settings = Mock()
    mock_settings.aws_region = "us-east-1"
    mock_get_settings.return_value = mock_settings

    # Mock S3 client
    mock_s3_instance = Mock()
    mock_s3_instance.download_csv.return_value = sample_enriched_csv_matched
    mock_s3_client_class.return_value = mock_s3_instance

    # Mock database session
    mock_session = MagicMock()
    mock_get_session.return_value.__enter__.return_value = mock_session

    # Mock database operations
    with patch("lambdas.handlers.database_import._import_row") as mock_import_row:
        event = DatabaseImportEvent(
            user_id="user123",
            s3_enriched_location="s3://bucket/imports/enriched.csv",
        )

        response = _import_enriched_csv(event)

        assert response.success is True
        assert mock_import_row.call_count == 2  # Two rows in CSV


@patch("lambdas.handlers.database_import.get_settings")
@patch("lambdas.handlers.database_import.S3Client")
def test_import_enriched_csv_s3_error(
    mock_s3_client_class: Mock,
    mock_get_settings: Mock,
) -> None:
    """Test CSV import handles S3 download errors."""
    # Mock settings
    mock_settings = Mock()
    mock_settings.aws_region = "us-east-1"
    mock_get_settings.return_value = mock_settings

    mock_s3_instance = Mock()
    mock_s3_instance.download_csv.side_effect = S3Error(
        "Download failed",
        operation="download",
        details={},
    )
    mock_s3_client_class.return_value = mock_s3_instance

    event = DatabaseImportEvent(
        user_id="user123",
        s3_enriched_location="s3://bucket/imports/enriched.csv",
    )

    response = _import_enriched_csv(event)

    assert response.success is False
    assert "S3 error" in response.error


@patch("lambdas.handlers.database_import.get_settings")
@patch("lambdas.handlers.database_import.get_session")
@patch("lambdas.handlers.database_import.S3Client")
def test_import_enriched_csv_empty_csv(
    mock_s3_client_class: Mock,
    mock_get_session: Mock,
    mock_get_settings: Mock,
) -> None:
    """Test importing empty CSV returns success with zero stats."""
    # Mock settings
    mock_settings = Mock()
    mock_settings.aws_region = "us-east-1"
    mock_get_settings.return_value = mock_settings

    empty_csv = "steam_app_id,name,playtime,match_status\n"

    mock_s3_instance = Mock()
    mock_s3_instance.download_csv.return_value = empty_csv
    mock_s3_client_class.return_value = mock_s3_instance

    mock_session = MagicMock()
    mock_get_session.return_value.__enter__.return_value = mock_session

    event = DatabaseImportEvent(
        user_id="user123",
        s3_enriched_location="s3://bucket/imports/enriched.csv",
    )

    response = _import_enriched_csv(event)

    assert response.success is True
    assert response.stats.imported_games_created == 0
    assert response.stats.games_created == 0


# ==================== Statistics Tracking Tests ====================


def test_import_stats_defaults() -> None:
    """Test ImportStats has correct default values."""
    stats = ImportStats()

    assert stats.imported_games_created == 0
    assert stats.imported_games_updated == 0
    assert stats.games_created == 0
    assert stats.games_updated == 0
    assert stats.library_items_created == 0


def test_import_stats_validation() -> None:
    """Test ImportStats validates non-negative values."""
    with pytest.raises(ValidationError):
        ImportStats(imported_games_created=-1)


# ==================== Playtime-Based Status Tests ====================


@patch("lambdas.handlers.database_import.create_library_item")
@patch("lambdas.handlers.database_import.upsert_game")
@patch("lambdas.handlers.database_import.upsert_imported_game")
@patch("lambdas.handlers.database_import._check_record_exists")
def test_import_row_zero_playtime_curious_about_status(
    mock_check_exists: Mock,
    mock_upsert_imported_game: Mock,
    mock_upsert_game: Mock,
    mock_create_library_item: Mock,
    mock_session: Mock,
) -> None:
    """Test zero playtime creates LibraryItem with CURIOUS_ABOUT status."""
    mock_check_exists.side_effect = [False, False]

    mock_imported_game = Mock()
    mock_upsert_imported_game.return_value = mock_imported_game

    mock_game = Mock()
    mock_game.id = "game123"
    mock_upsert_game.return_value = mock_game

    mock_library_item = Mock()
    mock_library_item.id = "library123"
    mock_library_item.status = LibraryItemStatus.CURIOUS_ABOUT
    mock_create_library_item.return_value = mock_library_item

    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=0,  # Zero playtime
        igdb_id=119,
        igdb_title="Dota 2",
        igdb_slug="dota-2",
        match_status=IgdbMatchStatus.MATCHED,
    )

    stats = ImportStats()

    _import_row(mock_session, row, "user123", stats)

    # Should create LibraryItem with playtime=0
    mock_create_library_item.assert_called_once()
    call_args = mock_create_library_item.call_args[0]
    library_item_data = call_args[1]
    assert library_item_data.playtime == 0


@patch("lambdas.handlers.database_import.create_library_item")
@patch("lambdas.handlers.database_import.upsert_game")
@patch("lambdas.handlers.database_import.upsert_imported_game")
@patch("lambdas.handlers.database_import._check_record_exists")
def test_import_row_nonzero_playtime_experienced_status(
    mock_check_exists: Mock,
    mock_upsert_imported_game: Mock,
    mock_upsert_game: Mock,
    mock_create_library_item: Mock,
    mock_session: Mock,
) -> None:
    """Test non-zero playtime creates LibraryItem with EXPERIENCED status."""
    mock_check_exists.side_effect = [False, False]

    mock_imported_game = Mock()
    mock_upsert_imported_game.return_value = mock_imported_game

    mock_game = Mock()
    mock_game.id = "game123"
    mock_upsert_game.return_value = mock_game

    mock_library_item = Mock()
    mock_library_item.id = "library123"
    mock_library_item.status = LibraryItemStatus.EXPERIENCED
    mock_create_library_item.return_value = mock_library_item

    row = EnrichedCsvRow(
        steam_app_id="570",
        name="Dota 2",
        playtime=15000,  # Non-zero playtime
        igdb_id=119,
        igdb_title="Dota 2",
        igdb_slug="dota-2",
        match_status=IgdbMatchStatus.MATCHED,
    )

    stats = ImportStats()

    _import_row(mock_session, row, "user123", stats)

    # Should create LibraryItem with playtime>0
    mock_create_library_item.assert_called_once()
    call_args = mock_create_library_item.call_args[0]
    library_item_data = call_args[1]
    assert library_item_data.playtime == 15000
