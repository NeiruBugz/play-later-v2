from __future__ import annotations

from pydantic import BaseModel, Field


class SteamOwnedGame(BaseModel):
    """A single game from Steam's owned games response.

    Attributes:
        appid: Steam application ID for the game
        name: Game name (may be None if not requested with include_appinfo)
        playtime_forever: Total playtime across all platforms in minutes
        img_icon_url: Icon hash for constructing icon URL
        img_logo_url: Logo hash for constructing logo URL
        has_community_visible_stats: Whether the game has community-visible stats
        playtime_windows_forever: Playtime on Windows in minutes
        playtime_mac_forever: Playtime on macOS in minutes
        playtime_linux_forever: Playtime on Linux in minutes
        rtime_last_played: Unix timestamp of last play session
    """

    appid: int
    name: str | None = None
    playtime_forever: int = 0
    img_icon_url: str | None = None
    img_logo_url: str | None = None
    has_community_visible_stats: bool | None = None
    playtime_windows_forever: int = 0
    playtime_mac_forever: int = 0
    playtime_linux_forever: int = 0
    rtime_last_played: int | None = None


class SteamGamesResponse(BaseModel):
    """The 'response' object from Steam API.

    Attributes:
        game_count: Number of games owned by the user
        games: List of owned games with metadata
    """

    game_count: int = 0
    games: list[SteamOwnedGame] = Field(default_factory=list)


class SteamApiResponse(BaseModel):
    """Top-level Steam API response wrapper.

    Attributes:
        response: The actual response data containing games
    """

    response: SteamGamesResponse
