from __future__ import annotations

from pydantic import BaseModel, Field


class IgdbCover(BaseModel):
    """IGDB cover image.

    Attributes:
        id: IGDB cover ID (optional, not returned when querying image_id only)
        image_id: Cover image ID for building URLs
        url: Cover image URL (may start with // for protocol-relative URLs)
    """

    id: int | None = None
    image_id: str | None = None
    url: str | None = None


class IgdbGenre(BaseModel):
    """IGDB genre.

    Attributes:
        id: IGDB genre ID
        name: Genre name (e.g., "Strategy", "MOBA")
    """

    id: int
    name: str


class IgdbPlatform(BaseModel):
    """IGDB platform.

    Attributes:
        id: IGDB platform ID
        name: Platform name (e.g., "PC (Microsoft Windows)")
    """

    id: int | None = None
    name: str


class IgdbReleaseDate(BaseModel):
    """IGDB release date.

    Attributes:
        platform: Platform for this release
        human: Human-readable date string (e.g., "Jul 09, 2013")
    """

    platform: IgdbPlatform | None = None
    human: str | None = None


class IgdbGame(BaseModel):
    """IGDB game with full details.

    Attributes:
        id: IGDB game ID
        name: Game name
        slug: URL-friendly game identifier (e.g., "dota-2")
        summary: Game description/summary text
        first_release_date: Unix timestamp of first release
        cover: Cover image information
        genres: List of genres
        platforms: List of supported platforms
        release_dates: List of release dates per platform
    """

    id: int
    name: str
    slug: str | None = None
    summary: str | None = None
    first_release_date: int | None = None
    cover: IgdbCover | None = None
    genres: list[IgdbGenre] = Field(default_factory=list)
    platforms: list[IgdbPlatform] = Field(default_factory=list)
    release_dates: list[IgdbReleaseDate] = Field(default_factory=list)

    @property
    def cover_url(self) -> str | None:
        """Get full cover URL with HTTPS protocol.

        Returns:
            Full HTTPS URL to cover image, or None if no cover exists.

        Example:
            >>> game = IgdbGame(id=1, name="Test", cover=IgdbCover(image_id="abc123"))
            >>> game.cover_url
            'https://images.igdb.com/igdb/image/upload/t_cover_big/abc123.jpg'
        """
        if self.cover and self.cover.image_id:
            return f"https://images.igdb.com/igdb/image/upload/t_cover_big/{self.cover.image_id}.jpg"
        if self.cover and self.cover.url:
            url = self.cover.url
            if url.startswith("//"):
                return f"https:{url}"
            return url
        return None


class IgdbExternalGame(BaseModel):
    """IGDB external game reference (e.g., Steam).

    Attributes:
        id: IGDB external game ID
        game: IGDB game ID this external reference points to
        uid: External platform ID (e.g., Steam app ID as string)
    """

    id: int
    game: int
    uid: str


class IgdbToken(BaseModel):
    """Twitch OAuth token response.

    Attributes:
        access_token: Bearer token for IGDB API requests
        expires_in: Token lifetime in seconds
        token_type: Token type (typically "bearer")
    """

    access_token: str
    expires_in: int
    token_type: str
