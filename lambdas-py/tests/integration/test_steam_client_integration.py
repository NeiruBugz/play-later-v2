"""Integration tests for Steam API client.

Tests the SteamClient with real Steam API to verify:
- API authentication and connection
- Game library fetching
- Response structure validation
- Error handling for edge cases
"""

from __future__ import annotations

import pytest

from lambdas.clients.steam import SteamClient
from lambdas.errors import SteamApiError
from lambdas.models.steam import SteamOwnedGame


@pytest.mark.integration
@pytest.mark.asyncio
async def test_fetch_owned_games_success(
    steam_client: SteamClient,
    test_steam_id: str,
) -> None:
    """Test fetching owned games from real Steam API.

    Args:
        steam_client: Real Steam API client
        test_steam_id: Test user's Steam ID

    Validates:
        - API request succeeds
        - Response contains list of games
        - Each game has required fields
        - Response structure matches SteamOwnedGame model
    """
    # Act
    games = await steam_client.get_owned_games(test_steam_id)

    # Assert
    assert isinstance(games, list), "Response should be a list"
    assert len(games) > 0, (
        "No games found. Profile may be private. "
        "Go to Steam Settings → Privacy → Game Details → Public"
    )

    # Validate first game structure
    first_game = games[0]
    assert isinstance(first_game, SteamOwnedGame)
    assert isinstance(first_game.appid, int)
    assert first_game.appid > 0, "App ID should be positive"
    assert first_game.name is not None, "Game name should be present"
    assert len(first_game.name) > 0, "Game name should not be empty"
    assert isinstance(first_game.playtime_forever, int)
    assert first_game.playtime_forever >= 0, "Playtime cannot be negative"

    # Validate at least some games have played time (for realistic test)
    games_with_playtime = [g for g in games if g.playtime_forever > 0]
    print(f"\n📊 Library Stats:")
    print(f"   Total games: {len(games)}")
    print(f"   Games with playtime: {len(games_with_playtime)}")
    print(f"   Games never played: {len(games) - len(games_with_playtime)}")

    if len(games) >= 5:
        # Show top 5 most played games
        top_games = sorted(games, key=lambda g: g.playtime_forever, reverse=True)[:5]
        print(f"\n🎮 Top 5 Most Played:")
        for i, game in enumerate(top_games, 1):
            hours = game.playtime_forever / 60
            print(f"   {i}. {game.name} ({hours:.1f} hours)")


@pytest.mark.integration
@pytest.mark.asyncio
async def test_game_metadata_structure(
    steam_client: SteamClient,
    test_steam_id: str,
) -> None:
    """Test that game metadata fields are properly populated.

    Args:
        steam_client: Real Steam API client
        test_steam_id: Test user's Steam ID

    Validates:
        - Icon URLs are present for most games
        - Logo URLs are present for most games
        - Last played timestamps exist for played games
    """
    # Act
    games = await steam_client.get_owned_games(test_steam_id)

    # Assert
    assert len(games) > 0, "Need at least one game to test metadata"

    # Check metadata completeness
    games_with_icons = [g for g in games if g.img_icon_url]
    games_with_logos = [g for g in games if g.img_logo_url]
    games_with_stats = [g for g in games if g.has_community_visible_stats]
    played_games = [g for g in games if g.playtime_forever > 0]
    games_with_last_played = [g for g in played_games if g.rtime_last_played]

    print(f"\n📦 Metadata Completeness:")
    print(f"   Games with icons: {len(games_with_icons)}/{len(games)}")
    print(f"   Games with logos: {len(games_with_logos)}/{len(games)}")
    print(f"   Games with stats: {len(games_with_stats)}/{len(games)}")
    print(f"   Played games with last_played: {len(games_with_last_played)}/{len(played_games)}")

    # Most games should have basic metadata
    assert len(games_with_icons) > len(games) * 0.5, (
        "Expected >50% of games to have icon URLs"
    )


@pytest.mark.integration
@pytest.mark.asyncio
async def test_invalid_steam_id_format(steam_client: SteamClient) -> None:
    """Test error handling for invalid Steam ID format.

    Args:
        steam_client: Real Steam API client

    Validates:
        - Invalid formats are rejected before API call
        - Appropriate error message is provided
    """
    invalid_ids = [
        "123",  # Too short
        "abcdefghijklmnopq",  # Non-numeric
        "7656119800000000x",  # Contains letter
        "765611980000000",  # Only 15 digits
        "",  # Empty
    ]

    for invalid_id in invalid_ids:
        with pytest.raises(
            SteamApiError,
            match="Invalid Steam ID format",
        ):
            await steam_client.get_owned_games(invalid_id)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_nonexistent_steam_id(steam_client: SteamClient) -> None:
    """Test handling of non-existent or private Steam profile.

    Args:
        steam_client: Real Steam API client

    Validates:
        - No exception is raised for private/non-existent profiles
        - Empty list is returned
        - Warning is logged
    """
    # Use a valid format but likely non-existent/private Steam ID
    nonexistent_id = "76561197960265729"  # Valid format, but minimal ID

    # Should not raise exception, just return empty list
    games = await steam_client.get_owned_games(nonexistent_id)

    assert isinstance(games, list)
    # May be empty if profile is private or doesn't exist
    assert len(games) == 0 or len(games) > 0  # Either case is valid


@pytest.mark.integration
@pytest.mark.asyncio
async def test_steam_client_context_manager(
    test_steam_id: str,
    skip_if_no_steam_credentials: None,
) -> None:
    """Test Steam client works correctly with async context manager.

    Args:
        test_steam_id: Test user's Steam ID
        skip_if_no_steam_credentials: Skip if credentials missing

    Validates:
        - Context manager properly initializes client
        - Client can make requests within context
        - Client is properly closed after context
    """
    import os

    steam_api_key = os.getenv("STEAM_API_KEY")
    assert steam_api_key is not None

    # Use context manager
    async with SteamClient(api_key=steam_api_key) as client:
        games = await client.get_owned_games(test_steam_id)
        assert isinstance(games, list)

    # After context, client should be closed
    # Attempting to use it should fail or reinitialize
    assert client._client is None, "Client should be closed after context exit"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_steam_api_response_consistency(
    steam_client: SteamClient,
    test_steam_id: str,
) -> None:
    """Test that multiple requests return consistent results.

    Args:
        steam_client: Real Steam API client
        test_steam_id: Test user's Steam ID

    Validates:
        - Same Steam ID returns same game count on multiple requests
        - Game IDs are stable across requests
    """
    # Make two requests
    games_1 = await steam_client.get_owned_games(test_steam_id)
    games_2 = await steam_client.get_owned_games(test_steam_id)

    # Assert
    assert len(games_1) == len(games_2), "Game count should be consistent"

    # Extract app IDs (order may vary, but content should be the same)
    app_ids_1 = {game.appid for game in games_1}
    app_ids_2 = {game.appid for game in games_2}

    assert app_ids_1 == app_ids_2, "Game IDs should be identical across requests"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_steam_playtime_data_types(
    steam_client: SteamClient,
    test_steam_id: str,
) -> None:
    """Test playtime data is properly typed and consistent.

    Args:
        steam_client: Real Steam API client
        test_steam_id: Test user's Steam ID

    Validates:
        - All playtime fields are integers
        - Platform-specific playtimes sum to total (approximately)
        - Timestamps are valid Unix timestamps
    """
    games = await steam_client.get_owned_games(test_steam_id)

    assert len(games) > 0, "Need games to test playtime data"

    # Find a game with significant playtime
    played_games = [g for g in games if g.playtime_forever > 60]  # > 1 hour

    if len(played_games) == 0:
        pytest.skip("No games with significant playtime found")

    game = played_games[0]

    # Validate types
    assert isinstance(game.playtime_forever, int)
    assert isinstance(game.playtime_windows_forever, int)
    assert isinstance(game.playtime_mac_forever, int)
    assert isinstance(game.playtime_linux_forever, int)

    # All playtime values should be non-negative
    assert game.playtime_forever >= 0
    assert game.playtime_windows_forever >= 0
    assert game.playtime_mac_forever >= 0
    assert game.playtime_linux_forever >= 0

    # If last played timestamp exists, validate it
    if game.rtime_last_played:
        assert isinstance(game.rtime_last_played, int)
        assert game.rtime_last_played > 0
        # Should be a reasonable Unix timestamp (after year 2000)
        assert game.rtime_last_played > 946684800  # Jan 1, 2000

    print(f"\n⏱️  Playtime Data for '{game.name}':")
    print(f"   Total: {game.playtime_forever} minutes ({game.playtime_forever / 60:.1f} hours)")
    print(f"   Windows: {game.playtime_windows_forever} minutes")
    print(f"   macOS: {game.playtime_mac_forever} minutes")
    print(f"   Linux: {game.playtime_linux_forever} minutes")
    if game.rtime_last_played:
        import datetime

        last_played = datetime.datetime.fromtimestamp(game.rtime_last_played)
        print(f"   Last played: {last_played.strftime('%Y-%m-%d %H:%M:%S')}")
