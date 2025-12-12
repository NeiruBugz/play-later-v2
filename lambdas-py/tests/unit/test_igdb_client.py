from __future__ import annotations

import time
from typing import Any

import httpx
import pytest
import respx

from lambdas.clients.igdb import STEAM_STORE_URL, IgdbClient
from lambdas.errors import IgdbApiError


@pytest.fixture
def igdb_credentials() -> dict[str, str]:
    """IGDB/Twitch credentials fixture."""
    return {
        "client_id": "test_client_id",
        "client_secret": "test_client_secret",
    }


@pytest.fixture
def mock_token_response() -> dict[str, Any]:
    """Mock successful Twitch OAuth2 token response."""
    return {
        "access_token": "test_token_abc123",
        "expires_in": 5184000,  # 60 days
        "token_type": "bearer",
    }


@pytest.fixture
def mock_game_response_full() -> list[dict[str, Any]]:
    """Mock IGDB games response with full game details (new query format)."""
    return [
        {
            "id": 1905,
            "name": "Dota 2",
            "summary": "Dota 2 is a multiplayer online battle arena video game.",
            "cover": {
                "image_id": "co1x73",
            },
            "release_dates": [
                {
                    "platform": {"name": "PC (Microsoft Windows)"},
                    "human": "Jul 09, 2013",
                },
                {
                    "platform": {"name": "Mac"},
                    "human": "Jul 18, 2013",
                },
            ],
        }
    ]


@pytest.fixture
def mock_game_response_minimal() -> list[dict[str, Any]]:
    """Mock IGDB games response with minimal game details."""
    return [
        {
            "id": 1905,
            "name": "Dota 2",
        }
    ]


@pytest.mark.unit
class TestIgdbClientTokenManagement:
    """Test OAuth2 token management."""

    @respx.mock
    async def test_token_refresh_on_first_request(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
        mock_game_response_full: list[dict[str, Any]],
    ) -> None:
        """Test that token is fetched before first API call."""
        token_route = respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        respx.post("https://api.igdb.com/v4/games").mock(
            return_value=httpx.Response(200, json=mock_game_response_full)
        )

        async with IgdbClient(**igdb_credentials) as client:
            await client.get_game_by_steam_app_id(570)

        assert token_route.called

    @respx.mock
    async def test_token_reused_when_valid(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
        mock_game_response_full: list[dict[str, Any]],
    ) -> None:
        """Test that token is not refetched when still valid."""
        token_route = respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        respx.post("https://api.igdb.com/v4/games").mock(
            return_value=httpx.Response(200, json=mock_game_response_full)
        )

        async with IgdbClient(**igdb_credentials) as client:
            # First call - token should be fetched
            await client.get_game_by_steam_app_id(570)
            first_call_count = token_route.call_count

            # Second call - token should be reused
            await client.get_game_by_steam_app_id(730)
            second_call_count = token_route.call_count

        # Token should only be fetched once
        assert first_call_count == 1
        assert second_call_count == 1

    @respx.mock
    async def test_token_refresh_when_expiring(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
    ) -> None:
        """Test that token is refreshed 60 seconds before expiry."""
        # Mock token endpoint with short expiry
        short_expiry_token = {**mock_token_response, "expires_in": 100}
        token_route = respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=short_expiry_token)
        )

        # Mock games endpoint
        respx.post("https://api.igdb.com/v4/games").mock(
            return_value=httpx.Response(200, json=[{"id": 1905, "name": "Dota 2"}])
        )

        async with IgdbClient(**igdb_credentials) as client:
            # First call - token fetched
            await client.get_game_by_id(1905)
            assert token_route.call_count == 1

            # Simulate time passing (move expiry to within 60 seconds)
            if client._token_expiry is not None:
                client._token_expiry = time.time() + 50

            # Second call - token should be refreshed
            await client.get_game_by_id(1905)
            assert token_route.call_count == 2

    @respx.mock
    async def test_error_on_auth_failure(
        self,
        igdb_credentials: dict[str, str],
    ) -> None:
        """Test that 401 during token refresh raises IgdbApiError."""
        # Mock 401 response
        respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(401, json={"error": "Unauthorized"})
        )

        async with IgdbClient(**igdb_credentials) as client:
            with pytest.raises(IgdbApiError) as exc_info:
                await client.get_game_by_id(1905)

            assert exc_info.value.details["status_code"] == 401
            assert "Invalid IGDB/Twitch credentials" in exc_info.value.message


@pytest.mark.unit
class TestIgdbClientGameLookup:
    """Test game lookup functionality."""

    @respx.mock
    async def test_get_game_by_steam_app_id_found(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
        mock_game_response_full: list[dict[str, Any]],
    ) -> None:
        """Test successful game lookup by Steam app ID."""
        respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        games_route = respx.post("https://api.igdb.com/v4/games").mock(
            return_value=httpx.Response(200, json=mock_game_response_full)
        )

        async with IgdbClient(**igdb_credentials) as client:
            game = await client.get_game_by_steam_app_id(570)

        assert game is not None
        assert game.id == 1905
        assert game.name == "Dota 2"
        assert game.summary == "Dota 2 is a multiplayer online battle arena video game."
        assert len(game.release_dates) == 2
        assert game.cover is not None
        assert game.cover.image_id == "co1x73"

        assert games_route.called

        games_call = games_route.calls.last
        assert games_call is not None
        body = games_call.request.content.decode()
        assert f"{STEAM_STORE_URL}/570" in body
        assert "external_games.url" in body

    @respx.mock
    async def test_get_game_by_steam_app_id_not_found(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
    ) -> None:
        """Test game lookup when Steam app ID not in IGDB."""
        respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        respx.post("https://api.igdb.com/v4/games").mock(
            return_value=httpx.Response(200, json=[])
        )

        async with IgdbClient(**igdb_credentials) as client:
            game = await client.get_game_by_steam_app_id(999999)

        assert game is None

    @respx.mock
    async def test_get_game_by_id(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
        mock_game_response_full: list[dict[str, Any]],
    ) -> None:
        """Test game lookup by IGDB ID."""
        # Mock token endpoint
        respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        # Mock games endpoint
        games_route = respx.post("https://api.igdb.com/v4/games").mock(
            return_value=httpx.Response(200, json=mock_game_response_full)
        )

        async with IgdbClient(**igdb_credentials) as client:
            game = await client.get_game_by_id(1905)

        assert game is not None
        assert game.id == 1905
        assert game.name == "Dota 2"

        # Verify correct query body
        games_call = games_route.calls.last
        assert games_call is not None
        body = games_call.request.content.decode()
        assert "where id = 1905" in body

    @respx.mock
    async def test_get_game_by_id_not_found(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
    ) -> None:
        """Test game lookup when IGDB ID does not exist."""
        # Mock token endpoint
        respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        # Mock games endpoint with empty response
        respx.post("https://api.igdb.com/v4/games").mock(
            return_value=httpx.Response(200, json=[])
        )

        async with IgdbClient(**igdb_credentials) as client:
            game = await client.get_game_by_id(999999)

        assert game is None

    @respx.mock
    async def test_game_cover_url_from_image_id(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
        mock_game_response_full: list[dict[str, Any]],
    ) -> None:
        """Test that cover URLs are built from image_id."""
        respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        respx.post("https://api.igdb.com/v4/games").mock(
            return_value=httpx.Response(200, json=mock_game_response_full)
        )

        async with IgdbClient(**igdb_credentials) as client:
            game = await client.get_game_by_id(1905)

        assert game is not None
        assert game.cover is not None
        assert game.cover.image_id == "co1x73"
        assert game.cover_url == "https://images.igdb.com/igdb/image/upload/t_cover_big/co1x73.jpg"


@pytest.mark.unit
class TestIgdbClientCaching:
    """Test caching functionality."""

    @respx.mock
    async def test_get_game_by_steam_app_id_cached(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
        mock_game_response_full: list[dict[str, Any]],
    ) -> None:
        """Test that second lookup uses cache and does not hit API."""
        respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        games_route = respx.post("https://api.igdb.com/v4/games").mock(
            return_value=httpx.Response(200, json=mock_game_response_full)
        )

        async with IgdbClient(**igdb_credentials) as client:
            game1 = await client.get_game_by_steam_app_id(570)
            first_games_calls = games_route.call_count

            game2 = await client.get_game_by_steam_app_id(570)
            second_games_calls = games_route.call_count

        assert game1 is not None
        assert game2 is not None
        assert game1.id == game2.id

        assert first_games_calls == 1
        assert second_games_calls == 1

    @respx.mock
    async def test_negative_caching(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
    ) -> None:
        """Test that failed lookups are cached (negative caching)."""
        respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        games_route = respx.post("https://api.igdb.com/v4/games").mock(
            return_value=httpx.Response(200, json=[])
        )

        async with IgdbClient(**igdb_credentials) as client:
            game1 = await client.get_game_by_steam_app_id(999999)
            first_call_count = games_route.call_count

            game2 = await client.get_game_by_steam_app_id(999999)
            second_call_count = games_route.call_count

        assert game1 is None
        assert game2 is None

        assert first_call_count == 1
        assert second_call_count == 1

    @respx.mock
    async def test_cache_expiry(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
        mock_game_response_full: list[dict[str, Any]],
    ) -> None:
        """Test that cache entries expire after TTL."""
        respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        games_route = respx.post("https://api.igdb.com/v4/games").mock(
            return_value=httpx.Response(200, json=mock_game_response_full)
        )

        async with IgdbClient(**igdb_credentials, cache_ttl=1) as client:
            await client.get_game_by_steam_app_id(570)
            first_call_count = games_route.call_count

            time.sleep(1.1)

            await client.get_game_by_steam_app_id(570)
            second_call_count = games_route.call_count

        assert first_call_count == 1
        assert second_call_count == 2

    @respx.mock
    async def test_clear_cache(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
        mock_game_response_full: list[dict[str, Any]],
    ) -> None:
        """Test that clear_cache removes all cached entries."""
        respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        games_route = respx.post("https://api.igdb.com/v4/games").mock(
            return_value=httpx.Response(200, json=mock_game_response_full)
        )

        async with IgdbClient(**igdb_credentials) as client:
            await client.get_game_by_steam_app_id(570)
            first_call_count = games_route.call_count

            client.clear_cache()

            await client.get_game_by_steam_app_id(570)
            second_call_count = games_route.call_count

        assert first_call_count == 1
        assert second_call_count == 2


@pytest.mark.unit
class TestIgdbClientRateLimiting:
    """Test rate limiting functionality."""

    @respx.mock
    async def test_rate_limiting(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
        mock_game_response_full: list[dict[str, Any]],
    ) -> None:
        """Test that concurrent requests are throttled."""
        # Mock token endpoint
        respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        # Mock games endpoint
        respx.post("https://api.igdb.com/v4/games").mock(
            return_value=httpx.Response(200, json=mock_game_response_full)
        )

        async with IgdbClient(**igdb_credentials, rate_limit=2) as client:
            # Make 4 concurrent requests
            import asyncio

            start_time = time.time()
            tasks = [client.get_game_by_id(1905 + i) for i in range(4)]
            await asyncio.gather(*tasks)
            elapsed_time = time.time() - start_time

            # With rate_limit=2 and 0.25s delay, 4 requests should take at least 0.5s
            # (2 concurrent at t=0, 2 more at t=0.25)
            assert elapsed_time >= 0.5


@pytest.mark.unit
class TestIgdbClientErrorHandling:
    """Test error handling."""

    @respx.mock
    async def test_error_on_rate_limit(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
    ) -> None:
        """Test that 429 raises IgdbApiError."""
        # Mock token endpoint
        respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        # Mock games endpoint with 429 response
        respx.post("https://api.igdb.com/v4/games").mock(
            return_value=httpx.Response(429, json={"error": "Rate limit exceeded"})
        )

        async with IgdbClient(**igdb_credentials) as client:
            with pytest.raises(IgdbApiError) as exc_info:
                await client.get_game_by_id(1905)

            assert exc_info.value.details["status_code"] == 429
            assert "rate limit" in exc_info.value.message.lower()

    @respx.mock
    async def test_retry_on_timeout(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
        mock_game_response_full: list[dict[str, Any]],
    ) -> None:
        """Test that timeout errors trigger retry."""
        # Mock token endpoint
        respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        # Mock games endpoint to timeout twice, then succeed
        games_route = respx.post("https://api.igdb.com/v4/games").mock(
            side_effect=[
                httpx.TimeoutException("Connection timeout"),
                httpx.TimeoutException("Connection timeout"),
                httpx.Response(200, json=mock_game_response_full),
            ]
        )

        async with IgdbClient(**igdb_credentials) as client:
            game = await client.get_game_by_id(1905)

        # Should succeed after retries
        assert game is not None
        assert game.id == 1905

        # Should have been called 3 times (2 failures + 1 success)
        assert games_route.call_count == 3

    @respx.mock
    async def test_retry_on_network_error(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
        mock_game_response_full: list[dict[str, Any]],
    ) -> None:
        """Test that network errors trigger retry."""
        # Mock token endpoint
        respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        # Mock games endpoint to fail once, then succeed
        games_route = respx.post("https://api.igdb.com/v4/games").mock(
            side_effect=[
                httpx.NetworkError("Connection refused"),
                httpx.Response(200, json=mock_game_response_full),
            ]
        )

        async with IgdbClient(**igdb_credentials) as client:
            game = await client.get_game_by_id(1905)

        # Should succeed after retry
        assert game is not None
        assert games_route.call_count == 2

    @respx.mock
    async def test_error_on_invalid_json(
        self,
        igdb_credentials: dict[str, str],
        mock_token_response: dict[str, Any],
    ) -> None:
        """Test that invalid JSON response raises IgdbApiError."""
        # Mock token endpoint
        respx.post("https://id.twitch.tv/oauth2/token").mock(
            return_value=httpx.Response(200, json=mock_token_response)
        )

        # Mock games endpoint with invalid JSON
        respx.post("https://api.igdb.com/v4/games").mock(
            return_value=httpx.Response(200, content=b"not json")
        )

        async with IgdbClient(**igdb_credentials) as client:
            with pytest.raises(IgdbApiError) as exc_info:
                await client.get_game_by_id(1905)

            assert "Failed to parse" in exc_info.value.message
