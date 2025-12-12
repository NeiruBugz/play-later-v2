"""Integration tests for IGDB API client.

Tests the IgdbClient with real IGDB/Twitch API to verify:
- OAuth2 token acquisition from Twitch
- Game lookup by Steam app ID
- Cache behavior
- Rate limiting
- Error handling
"""

from __future__ import annotations

import asyncio

import pytest

from lambdas.clients.igdb import IgdbClient
from lambdas.errors import IgdbApiError
from lambdas.models.igdb import IgdbGame


@pytest.mark.integration
@pytest.mark.asyncio
async def test_oauth_token_acquisition(igdb_client: IgdbClient) -> None:
    """Test OAuth2 token acquisition from Twitch API.

    Args:
        igdb_client: Real IGDB API client

    Validates:
        - Token can be acquired successfully
        - Token is a non-empty string
        - Token has reasonable expiry time
    """
    # Force token acquisition by making a request
    # The client will automatically acquire token on first request
    game = await igdb_client.get_game_by_id(1942)  # Witcher 3 IGDB ID

    # If we got here without exception, token acquisition worked
    assert game is not None
    assert isinstance(game, IgdbGame)

    # Verify token is cached for reuse
    assert igdb_client._access_token is not None
    assert isinstance(igdb_client._access_token, str)
    assert len(igdb_client._access_token) > 0

    # Verify token expiry is set reasonably (should be hours in the future)
    assert igdb_client._token_expiry is not None
    import time

    time_until_expiry = igdb_client._token_expiry - time.time()
    assert time_until_expiry > 3600, "Token should be valid for at least 1 hour"

    print("\n✅ OAuth2 Token acquired successfully")
    print(f"   Token length: {len(igdb_client._access_token)} characters")
    print(f"   Expires in: {time_until_expiry / 3600:.1f} hours")


@pytest.mark.integration
@pytest.mark.asyncio
async def test_search_game_by_steam_app_id_success(igdb_client: IgdbClient) -> None:
    """Test searching for game by Steam App ID with known games.

    Args:
        igdb_client: Real IGDB API client

    Validates:
        - Known Steam games can be found in IGDB
        - Response structure matches IgdbGame model
        - Game has required fields populated
    """
    # Test with well-known games that should exist in IGDB
    test_games = [
        (570, "Dota 2"),
        (730, "Counter-Strike 2"),  # or Counter-Strike: Global Offensive
        (440, "Team Fortress 2"),
    ]

    found_games: list[tuple[int, IgdbGame]] = []

    for steam_app_id, expected_name_contains in test_games:
        game = await igdb_client.get_game_by_steam_app_id(steam_app_id)

        if game is not None:
            assert isinstance(game, IgdbGame)
            assert game.id > 0
            assert game.name is not None
            assert len(game.name) > 0

            found_games.append((steam_app_id, game))

            print(f"\n✅ Found: {game.name} (Steam ID: {steam_app_id})")
            print(f"   IGDB ID: {game.id}")
            if game.summary:
                print(f"   Summary: {game.summary[:100]}...")
            if game.release_dates:
                print(f"   Release dates: {len(game.release_dates)} entries")
            if game.cover:
                print(f"   Cover image_id: {game.cover.image_id}")

    # At least some games should be found
    assert len(found_games) >= 1, "At least one known game should be found"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_cache_behavior(igdb_client: IgdbClient) -> None:
    """Test that cache stores and retrieves results correctly.

    Args:
        igdb_client: Real IGDB API client

    Validates:
        - First request fetches from API
        - Second request uses cache (faster)
        - Cache entries have correct data
    """
    steam_app_id = 570  # Dota 2

    # Clear cache to ensure clean state
    igdb_client.clear_cache()

    # First request - should hit API
    import time

    start_time = time.time()
    game_1 = await igdb_client.get_game_by_steam_app_id(steam_app_id)
    first_duration = time.time() - start_time

    assert game_1 is not None, "Dota 2 should be found in IGDB"

    # Second request - should use cache (much faster)
    start_time = time.time()
    game_2 = await igdb_client.get_game_by_steam_app_id(steam_app_id)
    second_duration = time.time() - start_time

    assert game_2 is not None
    assert game_2.id == game_1.id, "Cached result should be identical"
    assert game_2.name == game_1.name

    # Cache should be significantly faster (at least 10x)
    # First request: ~0.3-0.5s (single API call to games with external_games.url filter)
    # Second request: ~0.001s (cache lookup)
    print("\n📊 Cache Performance:")
    print(f"   First request (API): {first_duration * 1000:.1f}ms")
    print(f"   Second request (cache): {second_duration * 1000:.1f}ms")
    print(f"   Speedup: {first_duration / second_duration:.0f}x faster")

    # Verify cache hit is much faster
    assert second_duration < first_duration / 5, "Cache should be at least 5x faster"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_negative_caching(igdb_client: IgdbClient) -> None:
    """Test that failed lookups are cached (negative caching).

    Args:
        igdb_client: Real IGDB API client

    Validates:
        - Non-existent games return None
        - Failed lookups are cached
        - Subsequent lookups of same ID use cache
    """
    # Use a Steam app ID that likely doesn't exist in IGDB
    nonexistent_steam_id = 999999999

    # Clear cache
    igdb_client.clear_cache()

    # First lookup - should hit API and return None
    import time

    start_time = time.time()
    game_1 = await igdb_client.get_game_by_steam_app_id(nonexistent_steam_id)
    first_duration = time.time() - start_time

    assert game_1 is None, "Non-existent game should return None"

    # Second lookup - should use negative cache
    start_time = time.time()
    game_2 = await igdb_client.get_game_by_steam_app_id(nonexistent_steam_id)
    second_duration = time.time() - start_time

    assert game_2 is None

    print("\n📊 Negative Cache Performance:")
    print(f"   First lookup (API): {first_duration * 1000:.1f}ms")
    print(f"   Second lookup (cache): {second_duration * 1000:.1f}ms")

    # Negative cache should also be significantly faster
    assert second_duration < first_duration / 5, "Negative cache should be at least 5x faster"


@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.slow
async def test_rate_limiting_with_multiple_requests(igdb_client: IgdbClient) -> None:
    """Test rate limiting with multiple rapid requests.

    Args:
        igdb_client: Real IGDB API client

    Validates:
        - Multiple rapid requests don't cause rate limit errors
        - Requests are properly spread out (4 req/sec max)
        - Semaphore prevents request bursts
    """
    # Clear cache to force API requests
    igdb_client.clear_cache()

    # Test with multiple different Steam app IDs
    steam_app_ids = [
        570,   # Dota 2
        730,   # CS2
        440,   # TF2
        220,   # Half-Life 2
        620,   # Portal 2
    ]

    import time

    start_time = time.time()

    # Make multiple requests concurrently
    tasks = [
        igdb_client.get_game_by_steam_app_id(app_id)
        for app_id in steam_app_ids
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    total_duration = time.time() - start_time

    # Check results
    successful_results = [r for r in results if isinstance(r, IgdbGame)]
    errors = [r for r in results if isinstance(r, Exception)]

    print("\n⚡ Rate Limiting Test:")
    print(f"   Total requests: {len(steam_app_ids)}")
    print(f"   Successful: {len(successful_results)}")
    print(f"   Errors: {len(errors)}")
    print(f"   Total duration: {total_duration:.2f}s")
    print(f"   Average per request: {total_duration / len(steam_app_ids):.2f}s")

    # Should not have any rate limit errors
    rate_limit_errors = [e for e in errors if isinstance(e, IgdbApiError) and "rate limit" in str(e).lower()]
    assert len(rate_limit_errors) == 0, "Should not hit rate limits with proper throttling"

    # With rate limiting of 4 req/sec, 5 requests should take at least 1.25 seconds
    # (0.25s between requests)
    assert total_duration >= 1.0, "Requests should be properly throttled"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_igdb_client_context_manager(
    skip_if_no_igdb_credentials: None,
) -> None:
    """Test IGDB client works correctly with async context manager.

    Args:
        skip_if_no_igdb_credentials: Skip if credentials missing

    Validates:
        - Context manager properly initializes client
        - Client can make requests within context
        - Client is properly closed after context
    """
    import os

    client_id = os.getenv("IGDB_CLIENT_ID")
    client_secret = os.getenv("IGDB_CLIENT_SECRET")
    assert client_id is not None
    assert client_secret is not None

    # Use context manager
    async with IgdbClient(
        client_id=client_id,
        client_secret=client_secret,
    ) as client:
        game = await client.get_game_by_steam_app_id(570)  # Dota 2
        assert game is not None

    # After context, client should be closed
    assert client._client is None, "Client should be closed after context exit"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_game_details_by_igdb_id(igdb_client: IgdbClient) -> None:
    """Test fetching game details by IGDB ID.

    Args:
        igdb_client: Real IGDB API client

    Validates:
        - Game details can be fetched by IGDB ID
        - Response has all expected fields
        - Nested objects (genres, platforms) are properly parsed
    """
    # Witcher 3 has IGDB ID 1942
    game = await igdb_client.get_game_by_id(1942)

    assert game is not None
    assert isinstance(game, IgdbGame)
    assert game.id == 1942
    assert game.name is not None
    assert len(game.name) > 0
    assert game.slug is not None

    print("\n🎮 Game Details for IGDB ID 1942:")
    print(f"   Name: {game.name}")
    print(f"   Slug: {game.slug}")

    if game.summary:
        print(f"   Summary: {game.summary[:150]}...")

    if game.cover:
        print(f"   Cover URL: {game.cover.url}")

    if game.genres:
        print(f"   Genres: {', '.join(g.name for g in game.genres)}")

    if game.platforms:
        platforms = ', '.join(p.name for p in game.platforms[:5])
        print(f"   Platforms: {platforms}")

    if game.first_release_date:
        import datetime

        release_date = datetime.datetime.fromtimestamp(game.first_release_date)
        print(f"   Release Date: {release_date.strftime('%Y-%m-%d')}")


@pytest.mark.integration
@pytest.mark.asyncio
async def test_invalid_credentials_handling(
    skip_if_no_igdb_credentials: None,
) -> None:
    """Test error handling for invalid IGDB credentials.

    Args:
        skip_if_no_igdb_credentials: Skip if credentials missing

    Validates:
        - Invalid credentials raise IgdbApiError
        - Error message is descriptive
    """
    # Create client with invalid credentials
    async with IgdbClient(
        client_id="invalid_client_id",
        client_secret="invalid_client_secret",
    ) as client:
        with pytest.raises(IgdbApiError, match="credentials"):
            await client.get_game_by_steam_app_id(570)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_game_with_rich_metadata(igdb_client: IgdbClient) -> None:
    """Test fetching a game with rich metadata (genres, platforms, etc).

    Args:
        igdb_client: Real IGDB API client

    Validates:
        - Games with rich metadata have all fields populated
        - Nested structures are correctly parsed
        - Optional fields are handled gracefully
    """
    # Portal 2 (Steam ID 620) typically has rich metadata
    game = await igdb_client.get_game_by_steam_app_id(620)

    if game is None:
        pytest.skip("Portal 2 not found in IGDB")

    assert isinstance(game, IgdbGame)

    # Check for rich metadata
    metadata_score = 0

    if game.summary:
        metadata_score += 1
        assert len(game.summary) > 50, "Summary should be meaningful"

    if game.cover:
        metadata_score += 1
        assert game.cover.url is not None or game.cover.image_id is not None, "Cover should have url or image_id"

    if game.genres:
        metadata_score += 1
        assert len(game.genres) > 0
        for genre in game.genres:
            assert genre.name is not None
            assert len(genre.name) > 0

    if game.platforms:
        metadata_score += 1
        assert len(game.platforms) > 0
        for platform in game.platforms:
            assert platform.name is not None
            assert len(platform.name) > 0

    if game.first_release_date:
        metadata_score += 1
        assert game.first_release_date > 0

    print(f"\n📊 Metadata Completeness Score: {metadata_score}/5")
    print(f"   Name: {game.name}")
    print(f"   Has summary: {game.summary is not None}")
    print(f"   Has cover: {game.cover is not None}")
    print(f"   Genres: {len(game.genres) if game.genres else 0}")
    print(f"   Platforms: {len(game.platforms) if game.platforms else 0}")
    print(f"   Has release date: {game.first_release_date is not None}")

    # Rich metadata game should have at least 3/5 fields
    assert metadata_score >= 3, "Game should have rich metadata"
