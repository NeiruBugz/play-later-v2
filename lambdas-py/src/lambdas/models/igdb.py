from __future__ import annotations

from pydantic import BaseModel, Field


class IgdbCover(BaseModel):
    """IGDB cover image.

    Attributes:
        id: IGDB cover ID
        url: Cover image URL (may start with // for protocol-relative URLs)
    """

    id: int
    url: str


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

    id: int
    name: str


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
    """

    id: int
    name: str
    slug: str | None = None
    summary: str | None = None
    first_release_date: int | None = None
    cover: IgdbCover | None = None
    genres: list[IgdbGenre] = Field(default_factory=list)
    platforms: list[IgdbPlatform] = Field(default_factory=list)

    @property
    def cover_url(self) -> str | None:
        """Get full cover URL with HTTPS protocol.

        Returns:
            Full HTTPS URL to cover image, or None if no cover exists.

        Example:
            >>> game = IgdbGame(id=1, name="Test", cover=IgdbCover(id=1, url="//images.igdb.com/abc.jpg"))
            >>> game.cover_url
            'https://images.igdb.com/abc.jpg'
        """
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
