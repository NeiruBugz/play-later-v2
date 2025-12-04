from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pydantic import ValidationError

from lambdas.errors import S3Error, SteamApiError
from lambdas.handlers.steam_import import (
    SteamImportEvent,
    SteamImportResponse,
    handler,
)
from lambdas.models.steam import SteamOwnedGame


@pytest.fixture
def sample_games() -> list[SteamOwnedGame]:
    """Sample Steam games for testing."""
    return [
        SteamOwnedGame(appid=570, name="Dota 2", playtime_forever=12345),
        SteamOwnedGame(appid=730, name="CS2", playtime_forever=5000),
    ]


@pytest.fixture
def valid_event() -> dict[str, str]:
    """Valid Lambda event."""
    return {
        "user_id": "user-123",
        "steam_id64": "76561198012345678",
    }


class TestSteamImportEvent:
    """Tests for SteamImportEvent validation."""

    def test_valid_event(self, valid_event: dict[str, str]) -> None:
        """Valid event should pass validation."""
        event = SteamImportEvent(**valid_event)
        assert event.user_id == "user-123"
        assert event.steam_id64 == "76561198012345678"

    def test_invalid_steam_id_too_short(self) -> None:
        """Steam ID with fewer than 17 digits should fail validation."""
        with pytest.raises(ValidationError) as exc_info:
            SteamImportEvent(user_id="user-123", steam_id64="1234567890123456")

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert "steam_id64" in errors[0]["loc"]
        assert "17 digits" in errors[0]["msg"]

    def test_invalid_steam_id_too_long(self) -> None:
        """Steam ID with more than 17 digits should fail validation."""
        with pytest.raises(ValidationError) as exc_info:
            SteamImportEvent(user_id="user-123", steam_id64="765611980123456789")

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert "steam_id64" in errors[0]["loc"]

    def test_invalid_steam_id_non_numeric(self) -> None:
        """Steam ID with non-numeric characters should fail validation."""
        with pytest.raises(ValidationError) as exc_info:
            SteamImportEvent(user_id="user-123", steam_id64="7656119801234567X")

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert "steam_id64" in errors[0]["loc"]

    def test_missing_user_id(self) -> None:
        """Missing user_id should fail validation."""
        with pytest.raises(ValidationError) as exc_info:
            SteamImportEvent(steam_id64="76561198012345678")  # type: ignore[call-arg]

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert "user_id" in errors[0]["loc"]

    def test_empty_user_id(self) -> None:
        """Empty user_id should fail validation."""
        with pytest.raises(ValidationError) as exc_info:
            SteamImportEvent(user_id="", steam_id64="76561198012345678")

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert "user_id" in errors[0]["loc"]

    def test_missing_steam_id(self) -> None:
        """Missing steam_id64 should fail validation."""
        with pytest.raises(ValidationError) as exc_info:
            SteamImportEvent(user_id="user-123")  # type: ignore[call-arg]

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert "steam_id64" in errors[0]["loc"]


class TestSteamImportHandler:
    """Tests for the steam_import Lambda handler."""

    def test_handler_success_with_games(
        self, valid_event: dict[str, str], sample_games: list[SteamOwnedGame]
    ) -> None:
        """Handler should successfully import games and return S3 location."""
        with (
            patch("lambdas.handlers.steam_import.SteamClient") as mock_steam,
            patch("lambdas.handlers.steam_import.S3Client") as mock_s3,
            patch("lambdas.handlers.steam_import.get_settings") as mock_settings,
        ):
            # Setup mocks
            mock_settings.return_value.steam_api_key = "test-key"
            mock_settings.return_value.s3_bucket = "test-bucket"
            mock_settings.return_value.aws_region = "us-east-1"

            mock_steam_instance = AsyncMock()
            mock_steam_instance.get_owned_games.return_value = sample_games
            mock_steam.return_value.__aenter__.return_value = mock_steam_instance

            mock_s3_instance = MagicMock()
            mock_s3_instance.upload_games.return_value = (
                "imports/user-123/20241215-raw.csv"
            )
            mock_s3.return_value = mock_s3_instance

            # Call handler
            result = handler(valid_event, None)

            # Assertions
            assert result["success"] is True
            assert result["s3_location"] == "imports/user-123/20241215-raw.csv"
            assert result["game_count"] == 2
            assert result["error"] is None

            # Verify Steam client was called correctly
            mock_steam_instance.get_owned_games.assert_called_once_with(
                "76561198012345678"
            )

            # Verify S3 client was called correctly
            mock_s3_instance.upload_games.assert_called_once_with(
                user_id="user-123", games=sample_games
            )

    def test_handler_success_empty_library(self, valid_event: dict[str, str]) -> None:
        """Handler should handle empty library gracefully."""
        with (
            patch("lambdas.handlers.steam_import.SteamClient") as mock_steam,
            patch("lambdas.handlers.steam_import.get_settings") as mock_settings,
        ):
            # Setup mocks
            mock_settings.return_value.steam_api_key = "test-key"

            mock_steam_instance = AsyncMock()
            mock_steam_instance.get_owned_games.return_value = []
            mock_steam.return_value.__aenter__.return_value = mock_steam_instance

            # Call handler
            result = handler(valid_event, None)

            # Assertions
            assert result["success"] is True
            assert result["s3_location"] is None
            assert result["game_count"] == 0
            assert result["error"] is None

    def test_handler_returns_correct_game_count(
        self, valid_event: dict[str, str]
    ) -> None:
        """Handler should return correct game count."""
        games = [
            SteamOwnedGame(appid=i, name=f"Game {i}", playtime_forever=100 * i)
            for i in range(1, 6)
        ]

        with (
            patch("lambdas.handlers.steam_import.SteamClient") as mock_steam,
            patch("lambdas.handlers.steam_import.S3Client") as mock_s3,
            patch("lambdas.handlers.steam_import.get_settings") as mock_settings,
        ):
            # Setup mocks
            mock_settings.return_value.steam_api_key = "test-key"
            mock_settings.return_value.s3_bucket = "test-bucket"
            mock_settings.return_value.aws_region = "us-east-1"

            mock_steam_instance = AsyncMock()
            mock_steam_instance.get_owned_games.return_value = games
            mock_steam.return_value.__aenter__.return_value = mock_steam_instance

            mock_s3_instance = MagicMock()
            mock_s3_instance.upload_games.return_value = (
                "imports/user-123/20241215-raw.csv"
            )
            mock_s3.return_value = mock_s3_instance

            # Call handler
            result = handler(valid_event, None)

            # Assertions
            assert result["success"] is True
            assert result["game_count"] == 5

    def test_handler_invalid_steam_id_format(self) -> None:
        """Handler should handle invalid Steam ID format."""
        invalid_event = {"user_id": "user-123", "steam_id64": "invalid"}

        # Call handler
        result = handler(invalid_event, None)

        # Assertions
        assert result["success"] is False
        assert result["error"] is not None
        assert "Invalid input" in result["error"]
        assert "17 digits" in result["error"]

    def test_handler_missing_user_id(self) -> None:
        """Handler should handle missing user_id."""
        invalid_event = {"steam_id64": "76561198012345678"}

        # Call handler
        result = handler(invalid_event, None)

        # Assertions
        assert result["success"] is False
        assert result["error"] is not None
        assert "Invalid input" in result["error"]

    def test_handler_missing_steam_id(self) -> None:
        """Handler should handle missing steam_id64."""
        invalid_event = {"user_id": "user-123"}

        # Call handler
        result = handler(invalid_event, None)

        # Assertions
        assert result["success"] is False
        assert result["error"] is not None
        assert "Invalid input" in result["error"]

    def test_handler_empty_user_id(self) -> None:
        """Handler should handle empty user_id."""
        invalid_event = {"user_id": "", "steam_id64": "76561198012345678"}

        # Call handler
        result = handler(invalid_event, None)

        # Assertions
        assert result["success"] is False
        assert result["error"] is not None
        assert "Invalid input" in result["error"]

    def test_handler_steam_api_error(self, valid_event: dict[str, str]) -> None:
        """Handler should handle Steam API errors gracefully."""
        with (
            patch("lambdas.handlers.steam_import.SteamClient") as mock_steam,
            patch("lambdas.handlers.steam_import.get_settings") as mock_settings,
        ):
            # Setup mocks
            mock_settings.return_value.steam_api_key = "test-key"

            mock_steam_instance = AsyncMock()
            mock_steam_instance.get_owned_games.side_effect = SteamApiError(
                "Rate limit exceeded", status_code=429
            )
            mock_steam.return_value.__aenter__.return_value = mock_steam_instance

            # Call handler
            result = handler(valid_event, None)

            # Assertions
            assert result["success"] is False
            assert result["error"] is not None
            assert "Steam API error" in result["error"]
            assert "Rate limit exceeded" in result["error"]

    def test_handler_s3_error(
        self, valid_event: dict[str, str], sample_games: list[SteamOwnedGame]
    ) -> None:
        """Handler should handle S3 errors gracefully."""
        with (
            patch("lambdas.handlers.steam_import.SteamClient") as mock_steam,
            patch("lambdas.handlers.steam_import.S3Client") as mock_s3,
            patch("lambdas.handlers.steam_import.get_settings") as mock_settings,
        ):
            # Setup mocks
            mock_settings.return_value.steam_api_key = "test-key"
            mock_settings.return_value.s3_bucket = "test-bucket"
            mock_settings.return_value.aws_region = "us-east-1"

            mock_steam_instance = AsyncMock()
            mock_steam_instance.get_owned_games.return_value = sample_games
            mock_steam.return_value.__aenter__.return_value = mock_steam_instance

            mock_s3_instance = MagicMock()
            mock_s3_instance.upload_games.side_effect = S3Error(
                "Bucket does not exist", operation="upload"
            )
            mock_s3.return_value = mock_s3_instance

            # Call handler
            result = handler(valid_event, None)

            # Assertions
            assert result["success"] is False
            assert result["error"] is not None
            assert "S3 error" in result["error"]
            assert "Bucket does not exist" in result["error"]

    def test_handler_unexpected_error(self, valid_event: dict[str, str]) -> None:
        """Handler should handle unexpected errors gracefully."""
        with (
            patch("lambdas.handlers.steam_import.SteamClient") as mock_steam,
            patch("lambdas.handlers.steam_import.get_settings") as mock_settings,
        ):
            # Setup mocks
            mock_settings.return_value.steam_api_key = "test-key"

            mock_steam_instance = AsyncMock()
            mock_steam_instance.get_owned_games.side_effect = RuntimeError(
                "Unexpected issue"
            )
            mock_steam.return_value.__aenter__.return_value = mock_steam_instance

            # Call handler
            result = handler(valid_event, None)

            # Assertions
            assert result["success"] is False
            assert result["error"] is not None
            assert "Unexpected error" in result["error"]

    def test_handler_calls_steam_client_correctly(
        self, valid_event: dict[str, str], sample_games: list[SteamOwnedGame]
    ) -> None:
        """Handler should call Steam client with correct parameters."""
        with (
            patch("lambdas.handlers.steam_import.SteamClient") as mock_steam,
            patch("lambdas.handlers.steam_import.S3Client") as mock_s3,
            patch("lambdas.handlers.steam_import.get_settings") as mock_settings,
        ):
            # Setup mocks
            mock_settings.return_value.steam_api_key = "test-api-key"
            mock_settings.return_value.s3_bucket = "test-bucket"
            mock_settings.return_value.aws_region = "us-east-1"

            mock_steam_instance = AsyncMock()
            mock_steam_instance.get_owned_games.return_value = sample_games
            mock_steam.return_value.__aenter__.return_value = mock_steam_instance

            mock_s3_instance = MagicMock()
            mock_s3_instance.upload_games.return_value = (
                "imports/user-123/20241215-raw.csv"
            )
            mock_s3.return_value = mock_s3_instance

            # Call handler
            handler(valid_event, None)

            # Verify Steam client was initialized with correct API key
            mock_steam.assert_called_once_with(api_key="test-api-key")

            # Verify get_owned_games was called with correct Steam ID
            mock_steam_instance.get_owned_games.assert_called_once_with(
                "76561198012345678"
            )

    def test_handler_calls_s3_client_correctly(
        self, valid_event: dict[str, str], sample_games: list[SteamOwnedGame]
    ) -> None:
        """Handler should call S3 client with correct parameters."""
        with (
            patch("lambdas.handlers.steam_import.SteamClient") as mock_steam,
            patch("lambdas.handlers.steam_import.S3Client") as mock_s3,
            patch("lambdas.handlers.steam_import.get_settings") as mock_settings,
        ):
            # Setup mocks
            mock_settings.return_value.steam_api_key = "test-key"
            mock_settings.return_value.s3_bucket = "my-test-bucket"
            mock_settings.return_value.aws_region = "us-west-2"

            mock_steam_instance = AsyncMock()
            mock_steam_instance.get_owned_games.return_value = sample_games
            mock_steam.return_value.__aenter__.return_value = mock_steam_instance

            mock_s3_instance = MagicMock()
            mock_s3_instance.upload_games.return_value = (
                "imports/user-123/20241215-raw.csv"
            )
            mock_s3.return_value = mock_s3_instance

            # Call handler
            handler(valid_event, None)

            # Verify S3 client was initialized with correct bucket and region
            mock_s3.assert_called_once_with(bucket="my-test-bucket", region="us-west-2")

            # Verify upload_games was called with correct parameters
            mock_s3_instance.upload_games.assert_called_once_with(
                user_id="user-123", games=sample_games
            )


class TestSteamImportResponse:
    """Tests for SteamImportResponse model."""

    def test_success_response_with_games(self) -> None:
        """Success response with games should serialize correctly."""
        response = SteamImportResponse(
            success=True,
            s3_location="imports/user-123/20241215-raw.csv",
            game_count=5,
        )

        data = response.model_dump()
        assert data["success"] is True
        assert data["s3_location"] == "imports/user-123/20241215-raw.csv"
        assert data["game_count"] == 5
        assert data["error"] is None

    def test_success_response_empty_library(self) -> None:
        """Success response with no games should serialize correctly."""
        response = SteamImportResponse(
            success=True,
            s3_location=None,
            game_count=0,
        )

        data = response.model_dump()
        assert data["success"] is True
        assert data["s3_location"] is None
        assert data["game_count"] == 0
        assert data["error"] is None

    def test_error_response(self) -> None:
        """Error response should serialize correctly."""
        response = SteamImportResponse(
            success=False,
            error="Steam API error: Rate limit exceeded",
        )

        data = response.model_dump()
        assert data["success"] is False
        assert data["s3_location"] is None
        assert data["game_count"] is None
        assert data["error"] == "Steam API error: Rate limit exceeded"
