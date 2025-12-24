from __future__ import annotations

import httpx
import pytest
import respx

from lambdas.clients.steam import SteamClient
from lambdas.errors import SteamApiError
from lambdas.models.steam import SteamOwnedGame


@pytest.fixture
def steam_api_key() -> str:
    """Steam API key fixture."""
    return "test_api_key_12345"


@pytest.fixture
def valid_steam_id() -> str:
    """Valid Steam ID fixture (17 digits)."""
    return "76561197960435530"


@pytest.fixture
def mock_steam_response_success() -> dict[str, object]:
    """Mock successful Steam API response with multiple games."""
    return {
        "response": {
            "game_count": 3,
            "games": [
                {
                    "appid": 570,
                    "name": "Dota 2",
                    "playtime_forever": 12345,
                    "img_icon_url": "abc123",
                    "img_logo_url": "def456",
                    "has_community_visible_stats": True,
                    "playtime_windows_forever": 12000,
                    "playtime_mac_forever": 345,
                    "playtime_linux_forever": 0,
                    "rtime_last_played": 1699123456,
                },
                {
                    "appid": 730,
                    "name": "Counter-Strike 2",
                    "playtime_forever": 5000,
                    "img_icon_url": "ghi789",
                    "img_logo_url": "jkl012",
                    "has_community_visible_stats": True,
                    "playtime_windows_forever": 5000,
                    "playtime_mac_forever": 0,
                    "playtime_linux_forever": 0,
                    "rtime_last_played": 1699200000,
                },
                {
                    "appid": 440,
                    "name": "Team Fortress 2",
                    "playtime_forever": 0,
                    "img_icon_url": "mno345",
                    "img_logo_url": "pqr678",
                    "has_community_visible_stats": False,
                    "playtime_windows_forever": 0,
                    "playtime_mac_forever": 0,
                    "playtime_linux_forever": 0,
                },
            ],
        }
    }


@pytest.fixture
def mock_steam_response_empty() -> dict[str, object]:
    """Mock Steam API response with no games (private profile or no games)."""
    return {"response": {"game_count": 0, "games": []}}


@pytest.mark.unit
class TestSteamClientValidation:
    """Test Steam ID validation."""

    async def test_valid_steam_id(
        self, steam_api_key: str, valid_steam_id: str
    ) -> None:
        """Test that valid Steam ID passes validation."""
        client = SteamClient(api_key=steam_api_key)
        # Should not raise
        client._validate_steam_id(valid_steam_id)

    async def test_invalid_steam_id_too_short(self, steam_api_key: str) -> None:
        """Test that Steam ID with fewer than 17 digits is rejected."""
        client = SteamClient(api_key=steam_api_key)
        with pytest.raises(SteamApiError) as exc_info:
            client._validate_steam_id("1234567890123456")  # 16 digits
        assert "Invalid Steam ID format" in exc_info.value.message
        assert exc_info.value.details["steam_id"] == "1234567890123456"

    async def test_invalid_steam_id_too_long(self, steam_api_key: str) -> None:
        """Test that Steam ID with more than 17 digits is rejected."""
        client = SteamClient(api_key=steam_api_key)
        with pytest.raises(SteamApiError) as exc_info:
            client._validate_steam_id("123456789012345678")  # 18 digits
        assert "Invalid Steam ID format" in exc_info.value.message

    async def test_invalid_steam_id_non_numeric(self, steam_api_key: str) -> None:
        """Test that Steam ID with non-numeric characters is rejected."""
        client = SteamClient(api_key=steam_api_key)
        with pytest.raises(SteamApiError) as exc_info:
            client._validate_steam_id("7656119796043553A")  # Contains 'A'
        assert "Invalid Steam ID format" in exc_info.value.message

    async def test_invalid_steam_id_empty(self, steam_api_key: str) -> None:
        """Test that empty Steam ID is rejected."""
        client = SteamClient(api_key=steam_api_key)
        with pytest.raises(SteamApiError) as exc_info:
            client._validate_steam_id("")
        assert "Invalid Steam ID format" in exc_info.value.message


@pytest.mark.unit
class TestSteamClientGetOwnedGames:
    """Test get_owned_games method."""

    @respx.mock
    async def test_successful_fetch_multiple_games(
        self,
        steam_api_key: str,
        valid_steam_id: str,
        mock_steam_response_success: dict[str, object],
    ) -> None:
        """Test successful fetch of multiple games."""
        # Mock the Steam API endpoint
        respx.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
        ).mock(return_value=httpx.Response(200, json=mock_steam_response_success))

        async with SteamClient(api_key=steam_api_key) as client:
            games = await client.get_owned_games(valid_steam_id)

        assert len(games) == 3
        assert all(isinstance(game, SteamOwnedGame) for game in games)

        # Verify first game details
        dota = games[0]
        assert dota.appid == 570
        assert dota.name == "Dota 2"
        assert dota.playtime_forever == 12345
        assert dota.img_icon_url == "abc123"
        assert dota.has_community_visible_stats is True

        # Verify game with no playtime
        tf2 = games[2]
        assert tf2.appid == 440
        assert tf2.playtime_forever == 0
        assert tf2.has_community_visible_stats is False

    @respx.mock
    async def test_empty_library(
        self,
        steam_api_key: str,
        valid_steam_id: str,
        mock_steam_response_empty: dict[str, object],
    ) -> None:
        """Test handling of empty game library (private profile or no games)."""
        respx.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
        ).mock(return_value=httpx.Response(200, json=mock_steam_response_empty))

        async with SteamClient(api_key=steam_api_key) as client:
            games = await client.get_owned_games(valid_steam_id)

        assert len(games) == 0
        assert games == []

    @respx.mock
    async def test_private_profile_handling(
        self, steam_api_key: str, valid_steam_id: str
    ) -> None:
        """Test handling of private Steam profile."""
        # Steam API returns empty response for private profiles
        private_response = {"response": {}}

        respx.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
        ).mock(return_value=httpx.Response(200, json=private_response))

        async with SteamClient(api_key=steam_api_key) as client:
            games = await client.get_owned_games(valid_steam_id)

        # Should return empty list without raising an error
        assert len(games) == 0


@pytest.mark.unit
class TestSteamClientErrorHandling:
    """Test error handling in Steam client."""

    @respx.mock
    async def test_invalid_api_key(
        self, steam_api_key: str, valid_steam_id: str
    ) -> None:
        """Test handling of invalid API key (401 response)."""
        respx.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
        ).mock(return_value=httpx.Response(401, text="Unauthorized"))

        async with SteamClient(api_key=steam_api_key) as client:
            with pytest.raises(SteamApiError) as exc_info:
                await client.get_owned_games(valid_steam_id)

        assert "Invalid Steam API key" in exc_info.value.message
        assert exc_info.value.details["status_code"] == 401

    @respx.mock
    async def test_rate_limiting(
        self, steam_api_key: str, valid_steam_id: str
    ) -> None:
        """Test handling of rate limiting (429 response)."""
        respx.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
        ).mock(return_value=httpx.Response(429, text="Too Many Requests"))

        async with SteamClient(api_key=steam_api_key) as client:
            with pytest.raises(SteamApiError) as exc_info:
                await client.get_owned_games(valid_steam_id)

        assert "rate limit" in exc_info.value.message.lower()
        assert exc_info.value.details["status_code"] == 429

    @respx.mock
    async def test_network_timeout(
        self, steam_api_key: str, valid_steam_id: str
    ) -> None:
        """Test handling of network timeout after retries exhausted."""
        # Mock will be called 3 times due to tenacity retry (stop_after_attempt(3))
        route = respx.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
        ).mock(side_effect=httpx.TimeoutException("Connection timeout"))

        async with SteamClient(api_key=steam_api_key) as client:
            with pytest.raises(SteamApiError) as exc_info:
                await client.get_owned_games(valid_steam_id)

        # Verify retries were attempted (3 attempts total)
        assert route.call_count == 3
        # Verify error message indicates retries were exhausted
        assert "timed out" in exc_info.value.message.lower()
        assert "retries" in exc_info.value.message.lower()
        # Verify __cause__ preserves the original exception
        assert isinstance(exc_info.value.__cause__, httpx.TimeoutException)

    @respx.mock
    async def test_malformed_json_response(
        self, steam_api_key: str, valid_steam_id: str
    ) -> None:
        """Test handling of malformed JSON response."""
        respx.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
        ).mock(return_value=httpx.Response(200, text="Not valid JSON"))

        async with SteamClient(api_key=steam_api_key) as client:
            with pytest.raises(SteamApiError) as exc_info:
                await client.get_owned_games(valid_steam_id)

        assert "parse" in exc_info.value.message.lower()

    @respx.mock
    async def test_invalid_response_structure(
        self, steam_api_key: str, valid_steam_id: str
    ) -> None:
        """Test handling of response with invalid structure."""
        invalid_response = {"invalid": "structure"}

        respx.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
        ).mock(return_value=httpx.Response(200, json=invalid_response))

        async with SteamClient(api_key=steam_api_key) as client:
            with pytest.raises(SteamApiError) as exc_info:
                await client.get_owned_games(valid_steam_id)

        assert "Invalid response structure" in exc_info.value.message

    @respx.mock
    async def test_server_error(
        self, steam_api_key: str, valid_steam_id: str
    ) -> None:
        """Test handling of server error (500 response)."""
        respx.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
        ).mock(return_value=httpx.Response(500, text="Internal Server Error"))

        async with SteamClient(api_key=steam_api_key) as client:
            with pytest.raises(SteamApiError) as exc_info:
                await client.get_owned_games(valid_steam_id)

        assert exc_info.value.details["status_code"] == 500

    @respx.mock
    async def test_network_error(
        self, steam_api_key: str, valid_steam_id: str
    ) -> None:
        """Test handling of network connection error."""
        respx.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
        ).mock(side_effect=httpx.NetworkError("Connection refused"))

        async with SteamClient(api_key=steam_api_key) as client:
            with pytest.raises(SteamApiError) as exc_info:
                await client.get_owned_games(valid_steam_id)

        assert "Network error" in exc_info.value.message


@pytest.mark.unit
class TestSteamClientContextManager:
    """Test async context manager functionality."""

    @respx.mock
    async def test_context_manager_closes_client(
        self,
        steam_api_key: str,
        valid_steam_id: str,
        mock_steam_response_success: dict[str, object],
    ) -> None:
        """Test that context manager properly closes HTTP client."""
        respx.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
        ).mock(return_value=httpx.Response(200, json=mock_steam_response_success))

        async with SteamClient(api_key=steam_api_key) as client:
            await client.get_owned_games(valid_steam_id)
            assert client._client is not None

        # Client should be closed after exiting context
        assert client._client is None

    async def test_manual_close(self, steam_api_key: str) -> None:
        """Test manual close method."""
        client = SteamClient(api_key=steam_api_key)
        # Ensure client is initialized
        await client._ensure_client()
        assert client._client is not None

        # Close the client
        await client.close()
        assert client._client is None


@pytest.mark.unit
class TestSteamClientConfiguration:
    """Test client configuration and initialization."""

    def test_initialization_with_custom_base_url(self, steam_api_key: str) -> None:
        """Test client initialization with custom base URL."""
        custom_url = "https://custom-steam-api.example.com"
        client = SteamClient(api_key=steam_api_key, base_url=custom_url)
        assert client._api_key == steam_api_key
        assert client._base_url == custom_url

    def test_initialization_with_default_base_url(self, steam_api_key: str) -> None:
        """Test client initialization with default base URL."""
        client = SteamClient(api_key=steam_api_key)
        assert client._api_key == steam_api_key
        assert client._base_url == "https://api.steampowered.com"

    async def test_client_lazy_initialization(self, steam_api_key: str) -> None:
        """Test that HTTP client is lazily initialized."""
        client = SteamClient(api_key=steam_api_key)
        assert client._client is None

        # Client should be initialized on first use
        await client._ensure_client()
        assert client._client is not None

        # Subsequent calls should return the same client
        same_client = await client._ensure_client()
        assert same_client is client._client


@pytest.mark.unit
class TestSteamClientRequestParameters:
    """Test that requests are made with correct parameters."""

    @respx.mock
    async def test_request_includes_correct_parameters(
        self,
        steam_api_key: str,
        valid_steam_id: str,
        mock_steam_response_success: dict[str, object],
    ) -> None:
        """Test that API requests include all required parameters."""
        mock_route = respx.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
        ).mock(return_value=httpx.Response(200, json=mock_steam_response_success))

        async with SteamClient(api_key=steam_api_key) as client:
            await client.get_owned_games(valid_steam_id)

        # Verify the request was made with correct parameters
        assert mock_route.called
        call = mock_route.calls.last
        assert call.request.url.params["key"] == steam_api_key
        assert call.request.url.params["steamid"] == valid_steam_id
        assert call.request.url.params["include_appinfo"] == "1"
        assert call.request.url.params["include_played_free_games"] == "1"
        assert call.request.url.params["format"] == "json"

    @respx.mock
    async def test_request_includes_user_agent(
        self,
        steam_api_key: str,
        valid_steam_id: str,
        mock_steam_response_success: dict[str, object],
    ) -> None:
        """Test that requests include User-Agent header."""
        mock_route = respx.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
        ).mock(return_value=httpx.Response(200, json=mock_steam_response_success))

        async with SteamClient(api_key=steam_api_key) as client:
            await client.get_owned_games(valid_steam_id)

        call = mock_route.calls.last
        assert "User-Agent" in call.request.headers
        assert "SavePoint" in call.request.headers["User-Agent"]
