from __future__ import annotations

import re
from typing import Any

import httpx
from pydantic import ValidationError
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from lambdas.errors import SteamApiError
from lambdas.logging import get_logger
from lambdas.models.steam import SteamApiResponse, SteamOwnedGame

# Steam ID must be 17-digit number
STEAM_ID_PATTERN = re.compile(r"^\d{17}$")

# Steam API endpoint
STEAM_API_BASE = "https://api.steampowered.com"
GET_OWNED_GAMES_PATH = "/IPlayerService/GetOwnedGames/v1/"


class SteamClient:
    """Async client for Steam Web API.

    Provides methods to interact with Steam's Web API for fetching user-owned games.
    Includes built-in retry logic, rate limiting handling, and comprehensive error handling.

    Example:
        >>> async with SteamClient(api_key="your_key") as client:
        ...     games = await client.get_owned_games("76561197960435530")
        ...     print(f"Found {len(games)} games")
    """

    def __init__(self, api_key: str, base_url: str = STEAM_API_BASE) -> None:
        """Initialize Steam API client.

        Args:
            api_key: Steam Web API key
            base_url: Base URL for Steam API (defaults to production)
        """
        self._api_key = api_key
        self._base_url = base_url
        self._client: httpx.AsyncClient | None = None
        self._logger = get_logger(client="SteamClient")

    async def _ensure_client(self) -> httpx.AsyncClient:
        """Ensure HTTP client is initialized.

        Returns:
            Initialized AsyncClient instance
        """
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self._base_url,
                timeout=httpx.Timeout(30.0),
                headers={"User-Agent": "SavePoint-Steam-Import/1.0"},
            )
        return self._client

    def _validate_steam_id(self, steam_id64: str) -> None:
        """Validate Steam ID format.

        Args:
            steam_id64: Steam ID to validate

        Raises:
            SteamApiError: If Steam ID format is invalid
        """
        if not STEAM_ID_PATTERN.match(steam_id64):
            raise SteamApiError(
                message=f"Invalid Steam ID format: {steam_id64}. "
                "Steam ID must be a 17-digit number.",
                details={"steam_id": steam_id64, "expected_format": "17-digit number"},
            )

    @retry(
        retry=retry_if_exception_type(httpx.TimeoutException),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        reraise=True,
    )
    async def _make_request(
        self, path: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        """Make HTTP request to Steam API with retry logic.

        Args:
            path: API endpoint path
            params: Query parameters

        Returns:
            Parsed JSON response

        Raises:
            SteamApiError: If the request fails
        """
        client = await self._ensure_client()

        try:
            self._logger.info(
                "Making Steam API request",
                path=path,
                steam_id=params.get("steamid"),
            )

            response = await client.get(path, params=params)

            # Handle HTTP errors
            if response.status_code == 401:
                raise SteamApiError(
                    message="Invalid Steam API key",
                    status_code=401,
                    details={"path": path},
                )

            if response.status_code == 429:
                self._logger.warning("Steam API rate limit hit", status_code=429)
                raise SteamApiError(
                    message="Steam API rate limit exceeded. Please try again later.",
                    status_code=429,
                    details={"path": path},
                )

            if response.status_code >= 400:
                raise SteamApiError(
                    message=f"Steam API request failed with status {response.status_code}",
                    status_code=response.status_code,
                    details={"path": path, "response_text": response.text[:200]},
                )

            response.raise_for_status()

            # Parse JSON response
            try:
                data: dict[str, Any] = response.json()
                return data
            except ValueError as e:
                raise SteamApiError(
                    message="Failed to parse Steam API response as JSON",
                    details={"path": path, "error": str(e)},
                ) from e

        except httpx.TimeoutException:
            # Let TimeoutException propagate so tenacity can retry
            self._logger.warning("Steam API request timeout (will retry)", path=path)
            raise

        except httpx.NetworkError as e:
            self._logger.error("Steam API network error", path=path, error=str(e))
            raise SteamApiError(
                message="Network error while connecting to Steam API",
                details={"path": path, "error": str(e)},
            ) from e

        except SteamApiError:
            # Re-raise SteamApiError as-is
            raise

        except Exception as e:
            self._logger.error(
                "Unexpected error in Steam API request", path=path, error=str(e)
            )
            raise SteamApiError(
                message="Unexpected error while calling Steam API",
                details={"path": path, "error": str(e)},
            ) from e

    async def get_owned_games(self, steam_id64: str) -> list[SteamOwnedGame]:
        """Fetch all owned games for a Steam user.

        Args:
            steam_id64: The user's 64-bit Steam ID

        Returns:
            List of owned games with metadata

        Raises:
            SteamApiError: If the API request fails or Steam ID is invalid
        """
        # Validate Steam ID format
        self._validate_steam_id(steam_id64)

        # Prepare request parameters
        params = {
            "key": self._api_key,
            "steamid": steam_id64,
            "include_appinfo": "1",
            "include_played_free_games": "1",
            "format": "json",
        }

        # Make API request (retries handled by tenacity decorator on _make_request)
        try:
            data = await self._make_request(GET_OWNED_GAMES_PATH, params)
        except httpx.TimeoutException as e:
            # All retries exhausted, wrap with context
            self._logger.error(
                "Steam API request timed out after all retries",
                steam_id=steam_id64,
                path=GET_OWNED_GAMES_PATH,
            )
            raise SteamApiError(
                message="Steam API request timed out after multiple retries",
                details={
                    "steam_id": steam_id64,
                    "path": GET_OWNED_GAMES_PATH,
                    "timeout_seconds": 30,
                },
            ) from e

        # Parse and validate response
        try:
            api_response = SteamApiResponse.model_validate(data)
        except (ValueError, ValidationError) as e:
            raise SteamApiError(
                message="Invalid response structure from Steam API",
                details={"validation_error": str(e)},
            ) from e

        games = api_response.response.games
        game_count = len(games)

        # Handle empty response (likely private profile)
        if game_count == 0:
            self._logger.warning(
                "No games found in Steam library (profile may be private)",
                steam_id=steam_id64,
            )

        self._logger.info(
            "Successfully fetched Steam library",
            steam_id=steam_id64,
            game_count=game_count,
        )

        return games

    async def close(self) -> None:
        """Close the HTTP client and release resources."""
        if self._client is not None:
            await self._client.aclose()
            self._client = None
            self._logger.debug("Steam client closed")

    async def __aenter__(self) -> SteamClient:
        """Async context manager entry."""
        return self

    async def __aexit__(self, *args: Any) -> None:
        """Async context manager exit."""
        await self.close()
