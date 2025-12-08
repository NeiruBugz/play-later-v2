from __future__ import annotations

import asyncio
import time
from typing import Any

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from lambdas.errors import IgdbApiError
from lambdas.logging import get_logger
from lambdas.models.igdb import IgdbGame, IgdbToken

# Steam store URL pattern for IGDB external_games matching
STEAM_STORE_URL = "https://store.steampowered.com/app"


class IgdbClient:
    """Async client for IGDB API with OAuth2, rate limiting, and caching.

    Features:
    - Automatic OAuth2 token management via Twitch API
    - Rate limiting (4 requests/second via semaphore)
    - In-memory cache with 1-hour TTL
    - Negative caching (remembers failed lookups)
    - Retry with exponential backoff

    Example:
        >>> async with IgdbClient("client_id", "client_secret") as client:
        ...     game = await client.get_game_by_steam_app_id(570)
        ...     if game:
        ...         print(f"Found: {game.name}")
    """

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        base_url: str = "https://api.igdb.com/v4",
        twitch_url: str = "https://id.twitch.tv/oauth2/token",
        rate_limit: int = 4,
        cache_ttl: int = 3600,
    ) -> None:
        """Initialize IGDB client.

        Args:
            client_id: Twitch/IGDB client ID
            client_secret: Twitch/IGDB client secret
            base_url: IGDB API base URL
            twitch_url: Twitch OAuth2 token URL
            rate_limit: Max requests per second
            cache_ttl: Cache TTL in seconds
        """
        self._client_id = client_id
        self._client_secret = client_secret
        self._base_url = base_url
        self._twitch_url = twitch_url
        self._cache_ttl = cache_ttl
        self._logger = get_logger(client="IgdbClient")

        # HTTP client (lazy initialization)
        self._client: httpx.AsyncClient | None = None

        # OAuth2 token management
        self._access_token: str | None = None
        self._token_expiry: float | None = None

        # Rate limiting: 4 requests/second
        self._semaphore = asyncio.Semaphore(rate_limit)

        # Cache: {steam_app_id: (IgdbGame | None, expiry_timestamp)}
        # Stores both positive (IgdbGame) and negative (None) results
        self._cache: dict[int, tuple[IgdbGame | None, float]] = {}

    async def _ensure_client(self) -> httpx.AsyncClient:
        """Ensure HTTP client is initialized.

        Returns:
            Initialized AsyncClient instance
        """
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0),
                headers={"User-Agent": "SavePoint-IGDB-Client/1.0"},
            )
        return self._client

    async def _get_token(self) -> str:
        """Get valid OAuth2 token, refreshing if needed.

        Refreshes token when it's within 60 seconds of expiring.

        Returns:
            Valid access token

        Raises:
            IgdbApiError: If token refresh fails
        """
        # Check if we need to refresh (no token or expiring within 60 seconds)
        if self._access_token is None or (
            self._token_expiry is not None and time.time() > self._token_expiry - 60
        ):
            await self._refresh_token()

        if self._access_token is None:
            raise IgdbApiError(
                message="Failed to obtain access token",
                details={"client_id": self._client_id},
            )

        return self._access_token

    async def _refresh_token(self) -> None:
        """Fetch new OAuth2 token from Twitch.

        Raises:
            IgdbApiError: If token request fails
        """
        client = await self._ensure_client()

        try:
            self._logger.info("Refreshing IGDB OAuth2 token")

            response = await client.post(
                self._twitch_url,
                params={
                    "client_id": self._client_id,
                    "client_secret": self._client_secret,
                    "grant_type": "client_credentials",
                },
            )

            if response.status_code == 401:
                raise IgdbApiError(
                    message="Invalid IGDB/Twitch credentials",
                    status_code=401,
                    details={"client_id": self._client_id},
                )

            if response.status_code >= 400:
                raise IgdbApiError(
                    message=f"Token request failed with status {response.status_code}",
                    status_code=response.status_code,
                    details={"response_text": response.text[:200]},
                )

            response.raise_for_status()

            try:
                token_data = IgdbToken.model_validate(response.json())
            except ValueError as e:
                raise IgdbApiError(
                    message="Failed to parse token response",
                    details={"validation_error": str(e)},
                ) from e

            self._access_token = token_data.access_token
            self._token_expiry = time.time() + token_data.expires_in

            self._logger.debug(
                "IGDB token acquired",
                expires_in=token_data.expires_in,
            )

        except IgdbApiError:
            raise
        except Exception as e:
            raise IgdbApiError(
                message="Unexpected error during token refresh",
                details={"error": str(e)},
            ) from e

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        reraise=True,
    )
    async def _make_request(self, endpoint: str, body: str) -> list[dict[str, Any]]:
        """Make rate-limited request to IGDB API.

        Args:
            endpoint: API endpoint (e.g., "games", "external_games")
            body: IGDB query body

        Returns:
            JSON response as list of dicts

        Raises:
            IgdbApiError: If request fails
        """
        client = await self._ensure_client()
        token = await self._get_token()

        # Rate limiting: acquire semaphore and spread requests
        async with self._semaphore:
            # Spread requests to avoid bursts (250ms between requests for 4 req/sec)
            await asyncio.sleep(0.25)

            url = f"{self._base_url}/{endpoint}"

            try:
                self._logger.debug(
                    "Making IGDB API request",
                    endpoint=endpoint,
                    body_preview=body[:100],
                )

                response = await client.post(
                    url,
                    headers={
                        "Client-ID": self._client_id,
                        "Authorization": f"Bearer {token}",
                    },
                    content=body,
                )

                # Handle authentication errors
                if response.status_code == 401:
                    raise IgdbApiError(
                        message="IGDB authentication failed",
                        status_code=401,
                        details={"endpoint": endpoint},
                    )

                # Handle rate limiting
                if response.status_code == 429:
                    self._logger.warning("IGDB rate limit hit", status_code=429)
                    raise IgdbApiError(
                        message="IGDB API rate limit exceeded",
                        status_code=429,
                        details={"endpoint": endpoint},
                    )

                # Handle other errors
                if response.status_code >= 400:
                    raise IgdbApiError(
                        message=f"IGDB API request failed with status {response.status_code}",
                        status_code=response.status_code,
                        details={
                            "endpoint": endpoint,
                            "response_text": response.text[:200],
                        },
                    )

                response.raise_for_status()

                # Parse JSON response
                try:
                    data: list[dict[str, Any]] = response.json()
                    return data
                except ValueError as e:
                    raise IgdbApiError(
                        message="Failed to parse IGDB API response as JSON",
                        details={"endpoint": endpoint, "error": str(e)},
                    ) from e

            except httpx.TimeoutException:
                self._logger.warning("IGDB API request timeout", endpoint=endpoint)
                raise
            except httpx.NetworkError as e:
                self._logger.error("IGDB API network error", endpoint=endpoint, error=str(e))
                raise
            except IgdbApiError:
                raise
            except Exception as e:
                self._logger.error(
                    "Unexpected error in IGDB API request",
                    endpoint=endpoint,
                    error=str(e),
                )
                raise IgdbApiError(
                    message="Unexpected error while calling IGDB API",
                    details={"endpoint": endpoint, "error": str(e)},
                ) from e

    def _get_from_cache(self, steam_app_id: int) -> tuple[bool, IgdbGame | None]:
        """Get game from cache if available and not expired.

        Args:
            steam_app_id: Steam app ID

        Returns:
            Tuple of (found_in_cache, game_or_none)
        """
        if steam_app_id in self._cache:
            game, expiry = self._cache[steam_app_id]
            if time.time() < expiry:
                self._logger.debug(
                    "Cache hit",
                    steam_app_id=steam_app_id,
                    found=game is not None,
                )
                return (True, game)
            # Cache expired, remove entry
            del self._cache[steam_app_id]
            self._logger.debug("Cache expired", steam_app_id=steam_app_id)

        return (False, None)

    def _put_in_cache(self, steam_app_id: int, game: IgdbGame | None) -> None:
        """Put game in cache with TTL.

        Args:
            steam_app_id: Steam app ID
            game: Game to cache (None for negative caching)
        """
        expiry = time.time() + self._cache_ttl
        self._cache[steam_app_id] = (game, expiry)
        self._logger.debug(
            "Cached result",
            steam_app_id=steam_app_id,
            found=game is not None,
            ttl=self._cache_ttl,
        )

    async def get_game_by_steam_app_id(self, steam_app_id: int) -> IgdbGame | None:
        """Look up IGDB game by Steam app ID.

        Uses two-step lookup:
        1. Query external_games to find IGDB game ID for Steam app
        2. Query games to get full game details

        Results are cached (both positive and negative).

        Args:
            steam_app_id: Steam app ID

        Returns:
            IgdbGame if found, None if not found in IGDB

        Raises:
            IgdbApiError: If API request fails
        """
        # Check cache first
        found, game = self._get_from_cache(steam_app_id)
        if found:
            return game

        self._logger.info("Looking up game by Steam app ID", steam_app_id=steam_app_id)

        # Query games directly by Steam store URL
        # Fields match Game database model: igdbId, title, slug, description, coverImage, releaseDate
        steam_url = f"{STEAM_STORE_URL}/{steam_app_id}"
        games_body = (
            f"fields id, name, slug, summary, cover.image_id, first_release_date, "
            f"release_dates.platform.name, release_dates.human; "
            f'where external_games.url = "{steam_url}"; '
            f"limit 1;"
        )

        try:
            games_data = await self._make_request("games", games_body)

            if not games_data:
                self._logger.info(
                    "No IGDB match found for Steam app ID",
                    steam_app_id=steam_app_id,
                )
                self._put_in_cache(steam_app_id, None)
                return None

            try:
                game_result = IgdbGame.model_validate(games_data[0])
            except (ValueError, IndexError) as e:
                raise IgdbApiError(
                    message="Failed to parse games response",
                    details={
                        "steam_app_id": steam_app_id,
                        "validation_error": str(e),
                    },
                ) from e

            # Cache the result (may be None if game details not found)
            self._put_in_cache(steam_app_id, game_result)

            return game_result

        except IgdbApiError:
            raise
        except Exception as e:
            raise IgdbApiError(
                message="Unexpected error during game lookup",
                details={"steam_app_id": steam_app_id, "error": str(e)},
            ) from e

    async def get_game_by_id(self, igdb_id: int) -> IgdbGame | None:
        """Get game details by IGDB ID.

        Args:
            igdb_id: IGDB game ID

        Returns:
            IgdbGame if found, None otherwise

        Raises:
            IgdbApiError: If API request fails
        """
        self._logger.debug("Fetching game details by IGDB ID", igdb_id=igdb_id)

        games_body = (
            f"fields id, name, slug, summary, first_release_date, "
            f"cover.url, genres.name, platforms.name; "
            f"where id = {igdb_id};"
        )

        try:
            games_data = await self._make_request("games", games_body)

            if not games_data:
                self._logger.info("Game not found by IGDB ID", igdb_id=igdb_id)
                return None

            # Parse game details
            try:
                game = IgdbGame.model_validate(games_data[0])
                self._logger.info(
                    "Successfully fetched game details",
                    igdb_id=igdb_id,
                    name=game.name,
                )
                return game
            except (ValueError, IndexError) as e:
                raise IgdbApiError(
                    message="Failed to parse games response",
                    details={"igdb_id": igdb_id, "validation_error": str(e)},
                ) from e

        except IgdbApiError:
            raise
        except Exception as e:
            raise IgdbApiError(
                message="Unexpected error fetching game details",
                details={"igdb_id": igdb_id, "error": str(e)},
            ) from e

    def clear_cache(self) -> None:
        """Clear the cache."""
        cache_size = len(self._cache)
        self._cache.clear()
        self._logger.info("Cache cleared", previous_size=cache_size)

    async def close(self) -> None:
        """Close the HTTP client and release resources."""
        if self._client is not None:
            await self._client.aclose()
            self._client = None
            self._logger.debug("IGDB client closed")

    async def __aenter__(self) -> IgdbClient:
        """Async context manager entry."""
        return self

    async def __aexit__(self, *args: Any) -> None:
        """Async context manager exit."""
        await self.close()
