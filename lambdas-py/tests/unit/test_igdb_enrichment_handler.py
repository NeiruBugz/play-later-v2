from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pydantic import SecretStr, ValidationError

from lambdas.errors import IgdbApiError, S3Error
from lambdas.handlers.igdb_enrichment import (
    EnrichmentStats,
    IgdbEnrichmentEvent,
    IgdbEnrichmentResponse,
    _create_enriched_csv,
    _enrich_steam_library,
    _populate_igdb_data,
    handler,
)
from lambdas.models.igdb import IgdbCover, IgdbGame, IgdbGenre, IgdbPlatform
from lambdas.services.classifier import AppClassification


@pytest.fixture
def valid_event() -> dict[str, str]:
    """Fixture for a valid Lambda event."""
    return {
        "user_id": "user123",
        "s3_location": "s3://test-bucket/imports/user123/20240101120000-raw.csv",
    }


@pytest.fixture
def sample_raw_csv() -> str:
    """Fixture for sample raw CSV content."""
    return """appid,name,playtime_forever,img_icon_url,rtime_last_played
570,Dota 2,15000,https://steam.com/icon1.jpg,1704067200
730,Counter-Strike 2,5000,https://steam.com/icon2.jpg,1704153600
1091500,Cyberpunk 2077,8000,https://steam.com/icon3.jpg,1704240000
1091500,Cyberpunk 2077 - Phantom Liberty,200,,
570,Dota 2 - Soundtrack,0,,"""


@pytest.fixture
def sample_raw_games() -> list[dict[str, str | int | None]]:
    """Fixture for parsed raw games."""
    return [
        {
            "appid": 570,
            "name": "Dota 2",
            "playtime_forever": 15000,
            "img_icon_url": "https://steam.com/icon1.jpg",
            "rtime_last_played": 1704067200,
        },
        {
            "appid": 730,
            "name": "Counter-Strike 2",
            "playtime_forever": 5000,
            "img_icon_url": "https://steam.com/icon2.jpg",
            "rtime_last_played": 1704153600,
        },
        {
            "appid": 1091500,
            "name": "Cyberpunk 2077",
            "playtime_forever": 8000,
            "img_icon_url": "https://steam.com/icon3.jpg",
            "rtime_last_played": 1704240000,
        },
        {
            "appid": 1091501,
            "name": "Cyberpunk 2077 - Phantom Liberty",
            "playtime_forever": 200,
            "img_icon_url": None,
            "rtime_last_played": None,
        },
        {
            "appid": 571,
            "name": "Dota 2 - Soundtrack",
            "playtime_forever": 0,
            "img_icon_url": None,
            "rtime_last_played": None,
        },
    ]


@pytest.fixture
def sample_igdb_game() -> IgdbGame:
    """Fixture for a sample IGDB game."""
    return IgdbGame(
        id=1234,
        name="Dota 2",
        slug="dota-2",
        summary="A popular MOBA game",
        first_release_date=1342051200,  # 2012-07-12
        cover=IgdbCover(id=1, url="//images.igdb.com/cover.jpg"),
        genres=[IgdbGenre(id=1, name="MOBA"), IgdbGenre(id=2, name="Strategy")],
        platforms=[IgdbPlatform(id=6, name="PC (Microsoft Windows)")],
    )


@pytest.fixture
def mock_settings() -> MagicMock:
    """Fixture for mocked settings."""
    settings = MagicMock()
    settings.igdb_client_id = "test_client_id"
    settings.igdb_client_secret = SecretStr("test_client_secret")
    settings.aws_region = "us-east-1"
    return settings


class TestEventValidation:
    """Test input event validation."""

    def test_valid_event(self, valid_event: dict[str, str]) -> None:
        """Test that a valid event is accepted."""
        event = IgdbEnrichmentEvent(**valid_event)

        assert event.user_id == "user123"
        assert event.s3_location == "s3://test-bucket/imports/user123/20240101120000-raw.csv"

    def test_missing_user_id(self) -> None:
        """Test that missing user_id is rejected."""
        with pytest.raises(ValidationError):
            IgdbEnrichmentEvent(  # type: ignore[call-arg]
                s3_location="s3://test-bucket/imports/user123/20240101120000-raw.csv"
            )

    def test_missing_s3_location(self) -> None:
        """Test that missing s3_location is rejected."""
        with pytest.raises(ValidationError):
            IgdbEnrichmentEvent(user_id="user123")  # type: ignore[call-arg]

    def test_empty_user_id(self) -> None:
        """Test that empty user_id is rejected."""
        with pytest.raises(ValidationError):
            IgdbEnrichmentEvent(
                user_id="",
                s3_location="s3://test-bucket/imports/user123/20240101120000-raw.csv",
            )


class TestPopulateIgdbData:
    """Test IGDB data population helper."""

    def test_populate_full_igdb_data(self, sample_igdb_game: IgdbGame) -> None:
        """Test populating row with complete IGDB data."""
        from lambdas.handlers.igdb_enrichment import EnrichedGameRow

        row = EnrichedGameRow(
            appid=570,
            name="Dota 2",
            playtime_forever=15000,
            img_icon_url="https://steam.com/icon.jpg",
            rtime_last_played="1704067200",
            igdb_id="",
            igdb_slug="",
            igdb_name="",
            summary="",
            release_date="",
            cover_url="",
            genres="",
            platforms="",
            classification=AppClassification.GAME.value,
            match_status="matched",
        )

        result = _populate_igdb_data(row, sample_igdb_game)

        assert result.igdb_id == "1234"
        assert result.igdb_slug == "dota-2"
        assert result.igdb_name == "Dota 2"
        assert result.summary == "A popular MOBA game"
        assert result.release_date == "2012-07-12"
        assert result.cover_url == "https://images.igdb.com/cover.jpg"
        assert result.genres == "MOBA, Strategy"
        assert result.platforms == "PC (Microsoft Windows)"

    def test_populate_minimal_igdb_data(self) -> None:
        """Test populating row with minimal IGDB data."""
        from lambdas.handlers.igdb_enrichment import EnrichedGameRow

        row = EnrichedGameRow(
            appid=570,
            name="Dota 2",
            playtime_forever=15000,
            img_icon_url="",
            rtime_last_played="",
            igdb_id="",
            igdb_slug="",
            igdb_name="",
            summary="",
            release_date="",
            cover_url="",
            genres="",
            platforms="",
            classification=AppClassification.GAME.value,
            match_status="matched",
        )

        minimal_game = IgdbGame(
            id=999,
            name="Minimal Game",
            slug=None,
            summary=None,
            first_release_date=None,
            cover=None,
            genres=[],
            platforms=[],
        )

        result = _populate_igdb_data(row, minimal_game)

        assert result.igdb_id == "999"
        assert result.igdb_slug == ""
        assert result.igdb_name == "Minimal Game"
        assert result.summary == ""
        assert result.release_date == ""
        assert result.cover_url == ""
        assert result.genres == ""
        assert result.platforms == ""


class TestCreateEnrichedCsv:
    """Test enriched CSV generation."""

    def test_create_enriched_csv_with_data(self) -> None:
        """Test creating enriched CSV with game data."""
        from lambdas.handlers.igdb_enrichment import EnrichedGameRow

        rows = [
            EnrichedGameRow(
                appid=570,
                name="Dota 2",
                playtime_forever=15000,
                img_icon_url="https://steam.com/icon.jpg",
                rtime_last_played="1704067200",
                igdb_id="1234",
                igdb_slug="dota-2",
                igdb_name="Dota 2",
                summary="A MOBA game",
                release_date="2012-07-12",
                cover_url="https://images.igdb.com/cover.jpg",
                genres="MOBA, Strategy",
                platforms="PC (Microsoft Windows)",
                classification=AppClassification.GAME.value,
                match_status="matched",
            )
        ]

        csv_content = _create_enriched_csv(rows)

        assert "appid,name,playtime_forever" in csv_content
        assert "570,Dota 2,15000" in csv_content
        assert "1234,dota-2" in csv_content
        assert "matched" in csv_content

    def test_create_enriched_csv_empty(self) -> None:
        """Test creating enriched CSV with no rows."""
        csv_content = _create_enriched_csv([])

        # Should have headers but no data rows
        lines = csv_content.strip().split("\n")
        assert len(lines) == 1
        assert "appid,name" in lines[0]


class TestEnrichSteamLibrary:
    """Test the main enrichment workflow."""

    @pytest.mark.asyncio
    async def test_successful_enrichment_mixed_results(
        self,
        valid_event: dict[str, str],
        sample_raw_csv: str,
        sample_raw_games: list[dict[str, str | int | None]],
        sample_igdb_game: IgdbGame,
        mock_settings: MagicMock,
    ) -> None:
        """Test successful enrichment with matched, unmatched, and filtered games."""
        event = IgdbEnrichmentEvent(**valid_event)

        with (
            patch("lambdas.handlers.igdb_enrichment.get_settings", return_value=mock_settings),
            patch("lambdas.handlers.igdb_enrichment.S3Client") as mock_s3_class,
            patch("lambdas.handlers.igdb_enrichment.IgdbClient") as mock_igdb_class,
        ):
            # Mock S3 client
            mock_s3 = MagicMock()
            mock_s3_class.return_value = mock_s3
            mock_s3.download_csv.return_value = sample_raw_csv
            mock_s3.csv_to_games.return_value = sample_raw_games
            mock_s3.generate_enriched_csv_path.return_value = (
                "imports/user123/20240101120000-enriched.csv"
            )
            mock_s3.upload_csv.return_value = (
                "s3://test-bucket/imports/user123/20240101120000-enriched.csv"
            )

            # Mock IGDB client
            mock_igdb = AsyncMock()
            mock_igdb_class.return_value.__aenter__.return_value = mock_igdb

            # Set up IGDB responses: matched, matched, unmatched, filtered, filtered
            mock_igdb.get_game_by_steam_app_id.side_effect = [
                sample_igdb_game,  # Dota 2 - matched
                IgdbGame(
                    id=5678, name="Counter-Strike 2", slug="counter-strike-2"
                ),  # CS2 - matched
                None,  # Cyberpunk - unmatched
                # DLC and Soundtrack are filtered, so not called
            ]

            response = await _enrich_steam_library(event)

            assert response.success is True
            assert response.error is None
            assert response.s3_enriched_location == (
                "s3://test-bucket/imports/user123/20240101120000-enriched.csv"
            )

            assert response.stats is not None
            assert response.stats.processed == 5
            assert response.stats.matched == 2
            assert response.stats.unmatched == 1
            assert response.stats.filtered == 2

            # Verify S3 operations
            mock_s3.download_csv.assert_called_once()
            mock_s3.upload_csv.assert_called_once()

    @pytest.mark.asyncio
    async def test_all_games_matched(
        self, valid_event: dict[str, str], mock_settings: MagicMock
    ) -> None:
        """Test enrichment where all games are matched."""
        event = IgdbEnrichmentEvent(**valid_event)

        sample_games = [
            {
                "appid": 570,
                "name": "Dota 2",
                "playtime_forever": 15000,
                "img_icon_url": "https://steam.com/icon.jpg",
                "rtime_last_played": 1704067200,
            },
            {
                "appid": 730,
                "name": "Counter-Strike 2",
                "playtime_forever": 5000,
                "img_icon_url": "https://steam.com/icon2.jpg",
                "rtime_last_played": 1704153600,
            },
        ]

        with (
            patch("lambdas.handlers.igdb_enrichment.get_settings", return_value=mock_settings),
            patch("lambdas.handlers.igdb_enrichment.S3Client") as mock_s3_class,
            patch("lambdas.handlers.igdb_enrichment.IgdbClient") as mock_igdb_class,
        ):
            mock_s3 = MagicMock()
            mock_s3_class.return_value = mock_s3
            mock_s3.csv_to_games.return_value = sample_games
            mock_s3.upload_csv.return_value = "s3://test-bucket/enriched.csv"

            mock_igdb = AsyncMock()
            mock_igdb_class.return_value.__aenter__.return_value = mock_igdb
            mock_igdb.get_game_by_steam_app_id.return_value = IgdbGame(
                id=123, name="Test Game", slug="test-game"
            )

            response = await _enrich_steam_library(event)

            assert response.success is True
            assert response.stats is not None
            assert response.stats.processed == 2
            assert response.stats.matched == 2
            assert response.stats.unmatched == 0
            assert response.stats.filtered == 0

    @pytest.mark.asyncio
    async def test_all_games_unmatched(
        self, valid_event: dict[str, str], mock_settings: MagicMock
    ) -> None:
        """Test enrichment where no games are found in IGDB."""
        event = IgdbEnrichmentEvent(**valid_event)

        sample_games = [
            {
                "appid": 12345,
                "name": "Unknown Game",
                "playtime_forever": 100,
                "img_icon_url": "",
                "rtime_last_played": None,
            },
        ]

        with (
            patch("lambdas.handlers.igdb_enrichment.get_settings", return_value=mock_settings),
            patch("lambdas.handlers.igdb_enrichment.S3Client") as mock_s3_class,
            patch("lambdas.handlers.igdb_enrichment.IgdbClient") as mock_igdb_class,
        ):
            mock_s3 = MagicMock()
            mock_s3_class.return_value = mock_s3
            mock_s3.csv_to_games.return_value = sample_games
            mock_s3.upload_csv.return_value = "s3://test-bucket/enriched.csv"

            mock_igdb = AsyncMock()
            mock_igdb_class.return_value.__aenter__.return_value = mock_igdb
            mock_igdb.get_game_by_steam_app_id.return_value = None

            response = await _enrich_steam_library(event)

            assert response.success is True
            assert response.stats is not None
            assert response.stats.processed == 1
            assert response.stats.matched == 0
            assert response.stats.unmatched == 1
            assert response.stats.filtered == 0

    @pytest.mark.asyncio
    async def test_all_apps_filtered(
        self, valid_event: dict[str, str], mock_settings: MagicMock
    ) -> None:
        """Test enrichment where all apps are filtered (DLC/demos)."""
        event = IgdbEnrichmentEvent(**valid_event)

        sample_games = [
            {
                "appid": 1091501,
                "name": "Cyberpunk 2077 - Phantom Liberty",
                "playtime_forever": 200,
                "img_icon_url": None,
                "rtime_last_played": None,
            },
            {
                "appid": 571,
                "name": "Dota 2 - Soundtrack",
                "playtime_forever": 0,
                "img_icon_url": None,
                "rtime_last_played": None,
            },
        ]

        with (
            patch("lambdas.handlers.igdb_enrichment.get_settings", return_value=mock_settings),
            patch("lambdas.handlers.igdb_enrichment.S3Client") as mock_s3_class,
            patch("lambdas.handlers.igdb_enrichment.IgdbClient") as mock_igdb_class,
        ):
            mock_s3 = MagicMock()
            mock_s3_class.return_value = mock_s3
            mock_s3.csv_to_games.return_value = sample_games
            mock_s3.upload_csv.return_value = "s3://test-bucket/enriched.csv"

            mock_igdb = AsyncMock()
            mock_igdb_class.return_value.__aenter__.return_value = mock_igdb

            response = await _enrich_steam_library(event)

            assert response.success is True
            assert response.stats is not None
            assert response.stats.processed == 2
            assert response.stats.matched == 0
            assert response.stats.unmatched == 0
            assert response.stats.filtered == 2

            # IGDB should not be called for filtered apps
            mock_igdb.get_game_by_steam_app_id.assert_not_called()

    @pytest.mark.asyncio
    async def test_empty_csv(
        self, valid_event: dict[str, str], mock_settings: MagicMock
    ) -> None:
        """Test enrichment with empty CSV file."""
        event = IgdbEnrichmentEvent(**valid_event)

        with (
            patch("lambdas.handlers.igdb_enrichment.get_settings", return_value=mock_settings),
            patch("lambdas.handlers.igdb_enrichment.S3Client") as mock_s3_class,
        ):
            mock_s3 = MagicMock()
            mock_s3_class.return_value = mock_s3
            mock_s3.csv_to_games.return_value = []

            response = await _enrich_steam_library(event)

            assert response.success is True
            assert response.s3_enriched_location is None
            assert response.stats is not None
            assert response.stats.processed == 0

    @pytest.mark.asyncio
    async def test_invalid_s3_uri_format(self, mock_settings: MagicMock) -> None:
        """Test handling of invalid S3 URI format."""
        event = IgdbEnrichmentEvent(
            user_id="user123", s3_location="invalid-uri-format"
        )

        with patch("lambdas.handlers.igdb_enrichment.get_settings", return_value=mock_settings):
            response = await _enrich_steam_library(event)

        assert response.success is False
        assert response.error is not None
        assert "Invalid S3 URI format" in response.error

    @pytest.mark.asyncio
    async def test_invalid_s3_uri_missing_key(self, mock_settings: MagicMock) -> None:
        """Test handling of S3 URI without key."""
        event = IgdbEnrichmentEvent(user_id="user123", s3_location="s3://bucket-only")

        with patch("lambdas.handlers.igdb_enrichment.get_settings", return_value=mock_settings):
            response = await _enrich_steam_library(event)

        assert response.success is False
        assert response.error is not None
        assert "Invalid S3 URI format" in response.error

    @pytest.mark.asyncio
    async def test_s3_download_failure(
        self, valid_event: dict[str, str], mock_settings: MagicMock
    ) -> None:
        """Test handling of S3 download failure."""
        event = IgdbEnrichmentEvent(**valid_event)

        with (
            patch("lambdas.handlers.igdb_enrichment.get_settings", return_value=mock_settings),
            patch("lambdas.handlers.igdb_enrichment.S3Client") as mock_s3_class,
        ):
            mock_s3 = MagicMock()
            mock_s3_class.return_value = mock_s3
            mock_s3.download_csv.side_effect = S3Error(
                "Object not found", operation="download"
            )

            response = await _enrich_steam_library(event)

            assert response.success is False
            assert response.error is not None
            assert "S3 error" in response.error

    @pytest.mark.asyncio
    async def test_s3_upload_failure(
        self, valid_event: dict[str, str], mock_settings: MagicMock
    ) -> None:
        """Test handling of S3 upload failure."""
        event = IgdbEnrichmentEvent(**valid_event)

        sample_games = [
            {
                "appid": 570,
                "name": "Dota 2",
                "playtime_forever": 15000,
                "img_icon_url": "",
                "rtime_last_played": None,
            },
        ]

        with (
            patch("lambdas.handlers.igdb_enrichment.get_settings", return_value=mock_settings),
            patch("lambdas.handlers.igdb_enrichment.S3Client") as mock_s3_class,
            patch("lambdas.handlers.igdb_enrichment.IgdbClient") as mock_igdb_class,
        ):
            mock_s3 = MagicMock()
            mock_s3_class.return_value = mock_s3
            mock_s3.csv_to_games.return_value = sample_games
            mock_s3.upload_csv.side_effect = S3Error(
                "Upload failed", operation="upload"
            )

            mock_igdb = AsyncMock()
            mock_igdb_class.return_value.__aenter__.return_value = mock_igdb
            mock_igdb.get_game_by_steam_app_id.return_value = IgdbGame(
                id=123, name="Dota 2", slug="dota-2"
            )

            response = await _enrich_steam_library(event)

            assert response.success is False
            assert response.error is not None
            assert "S3 error" in response.error

    @pytest.mark.asyncio
    async def test_igdb_client_failure(
        self, valid_event: dict[str, str], mock_settings: MagicMock
    ) -> None:
        """Test handling of IGDB client failures."""
        event = IgdbEnrichmentEvent(**valid_event)

        sample_games = [
            {
                "appid": 570,
                "name": "Dota 2",
                "playtime_forever": 15000,
                "img_icon_url": "",
                "rtime_last_played": None,
            },
        ]

        with (
            patch("lambdas.handlers.igdb_enrichment.get_settings", return_value=mock_settings),
            patch("lambdas.handlers.igdb_enrichment.S3Client") as mock_s3_class,
            patch("lambdas.handlers.igdb_enrichment.IgdbClient") as mock_igdb_class,
        ):
            mock_s3 = MagicMock()
            mock_s3_class.return_value = mock_s3
            mock_s3.csv_to_games.return_value = sample_games
            mock_s3.upload_csv.return_value = "s3://test-bucket/enriched.csv"

            mock_igdb = AsyncMock()
            mock_igdb_class.return_value.__aenter__.return_value = mock_igdb
            mock_igdb.get_game_by_steam_app_id.side_effect = IgdbApiError(
                "API error", details={}
            )

            response = await _enrich_steam_library(event)

            # Should still succeed but mark game as error
            assert response.success is True
            assert response.stats is not None
            assert response.stats.unmatched == 1


class TestLambdaHandler:
    """Test the Lambda handler entry point."""

    def test_handler_with_valid_event(self, valid_event: dict[str, str]) -> None:
        """Test handler with valid event."""
        with patch(
            "lambdas.handlers.igdb_enrichment._enrich_steam_library"
        ) as mock_enrich:
            mock_enrich.return_value = IgdbEnrichmentResponse(
                success=True,
                s3_enriched_location="s3://bucket/enriched.csv",
                stats=EnrichmentStats(
                    processed=5, matched=2, unmatched=1, filtered=2
                ),
            )

            result = handler(valid_event, None)

            assert result["success"] is True
            assert result["s3_enriched_location"] == "s3://bucket/enriched.csv"
            assert result["stats"]["processed"] == 5

    def test_handler_with_invalid_event(self) -> None:
        """Test handler with invalid event data."""
        invalid_event = {"user_id": ""}  # Missing s3_location

        result = handler(invalid_event, None)

        assert result["success"] is False
        assert result["error"] is not None
        assert "Invalid input" in result["error"]

    def test_handler_with_unexpected_exception(self, valid_event: dict[str, str]) -> None:
        """Test handler with unexpected exception."""
        with patch(
            "lambdas.handlers.igdb_enrichment.IgdbEnrichmentEvent"
        ) as mock_event:
            mock_event.side_effect = RuntimeError("Unexpected error")

            result = handler(valid_event, None)

            assert result["success"] is False
            assert result["error"] is not None
            assert "Unexpected error" in result["error"]
