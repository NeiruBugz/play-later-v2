from __future__ import annotations

import re
from enum import Enum


class AppClassification(Enum):
    """Classification of a Steam app."""

    GAME = "game"  # Full game - should be enriched
    DLC = "dlc"  # Downloadable content
    SOUNDTRACK = "soundtrack"  # Music/OST
    DEMO = "demo"  # Demo version
    TOOL = "tool"  # SDK, Editor, Server
    MULTIPLAYER_COMPONENT = "multiplayer_component"  # Standalone MP component
    VIDEO = "video"  # Trailers, videos
    BONUS_CONTENT = "bonus_content"  # Art books, digital extras
    BETA = "beta"  # Beta/playtest versions


class ClassificationResult:
    """Result of classifying a Steam app."""

    def __init__(
        self,
        classification: AppClassification,
        should_enrich: bool,
        matched_pattern: str | None = None,
    ):
        self.classification = classification
        self.should_enrich = should_enrich
        self.matched_pattern = matched_pattern

    def __repr__(self) -> str:
        return f"ClassificationResult({self.classification.value}, enrich={self.should_enrich})"


# Classification pattern definitions
# Each pattern is (regex, classification, description)
# Patterns are checked in order, so more specific patterns should come first
_CLASSIFICATION_PATTERNS: list[tuple[re.Pattern[str], AppClassification, str]] = [
    # Multiplayer components (must have separator before "multiplayer")
    (
        re.compile(r"[-\s]+(multiplayer|multi-player)\b", re.IGNORECASE),
        AppClassification.MULTIPLAYER_COMPONENT,
        "multiplayer component",
    ),
    # DLC patterns
    (
        re.compile(r"[-\s]+dlc\b", re.IGNORECASE),
        AppClassification.DLC,
        "DLC marker",
    ),
    (
        re.compile(r"\bseason\s+pass\b", re.IGNORECASE),
        AppClassification.DLC,
        "season pass",
    ),
    (
        re.compile(r"[-:\s]+(expansion|blood\s+and\s+wine|phantom\s+liberty|shadow\s+of\s+the\s+erdtree)(\s+pack)?\b", re.IGNORECASE),
        AppClassification.DLC,
        "expansion",
    ),
    # Soundtrack patterns (must have separator before "soundtrack")
    (
        re.compile(r"[-\s]+(soundtrack|ost)\b", re.IGNORECASE),
        AppClassification.SOUNDTRACK,
        "soundtrack",
    ),
    (
        re.compile(r"\boriginal\s+soundtrack\b", re.IGNORECASE),
        AppClassification.SOUNDTRACK,
        "original soundtrack",
    ),
    # Demo patterns (word boundary or separator at end)
    (
        re.compile(r"(\s+demo\b|[-\s(]+demo[\s)]?$)", re.IGNORECASE),
        AppClassification.DEMO,
        "demo",
    ),
    # Tool patterns
    (
        re.compile(r"\bdedicated\s+server\b", re.IGNORECASE),
        AppClassification.TOOL,
        "dedicated server",
    ),
    (
        re.compile(r"[-\s]+sdk\b", re.IGNORECASE),
        AppClassification.TOOL,
        "SDK",
    ),
    (
        re.compile(r"[-\s]+editor\b", re.IGNORECASE),
        AppClassification.TOOL,
        "editor",
    ),
    (
        re.compile(r"\b(level|mod)\s+(editor|tool)\b", re.IGNORECASE),
        AppClassification.TOOL,
        "modding tool",
    ),
    # Video content
    (
        re.compile(r"[-\s]+trailer\b", re.IGNORECASE),
        AppClassification.VIDEO,
        "trailer",
    ),
    # Bonus content
    (
        re.compile(r"[-\s]+art\s*book\b", re.IGNORECASE),
        AppClassification.BONUS_CONTENT,
        "artbook",
    ),
    (
        re.compile(r"\bbonus\s+content\b", re.IGNORECASE),
        AppClassification.BONUS_CONTENT,
        "bonus content",
    ),
    (
        re.compile(r"\bdigital\s+(deluxe|artbook)\b", re.IGNORECASE),
        AppClassification.BONUS_CONTENT,
        "digital deluxe",
    ),
    # Beta/test versions
    (
        re.compile(r"\bplaytest\b", re.IGNORECASE),
        AppClassification.BETA,
        "playtest",
    ),
    (
        re.compile(r"[-\s]+beta\b", re.IGNORECASE),
        AppClassification.BETA,
        "beta",
    ),
    (
        re.compile(r"[-\s]+test\b", re.IGNORECASE),
        AppClassification.BETA,
        "test build",
    ),
]


def classify_steam_app(name: str | None) -> ClassificationResult:
    """
    Classify a Steam app based on its name.

    This function analyzes the app name to determine if it's a full game
    that should be enriched with IGDB data, or if it's supplementary
    content (DLC, soundtrack, demo, etc.) that should be filtered out.

    Args:
        name: The Steam app name (can be None for unnamed apps)

    Returns:
        ClassificationResult with classification type and whether to enrich

    Examples:
        >>> classify_steam_app("Dark Souls III")
        ClassificationResult(game, enrich=True)

        >>> classify_steam_app("Dark Souls III - Season Pass")
        ClassificationResult(dlc, enrich=False)

        >>> classify_steam_app("Dota 2 - Soundtrack")
        ClassificationResult(soundtrack, enrich=False)
    """
    if not name or not name.strip():
        return ClassificationResult(
            classification=AppClassification.GAME,
            should_enrich=False,
            matched_pattern="empty or None name",
        )

    for pattern, classification, description in _CLASSIFICATION_PATTERNS:
        if pattern.search(name):
            return ClassificationResult(
                classification=classification,
                should_enrich=False,
                matched_pattern=description,
            )

    return ClassificationResult(
        classification=AppClassification.GAME, should_enrich=True, matched_pattern=None
    )


def is_game(name: str | None) -> bool:
    """
    Convenience function to check if an app should be treated as a game.

    Args:
        name: The Steam app name

    Returns:
        True if the app is a game that should be enriched
    """
    return classify_steam_app(name).should_enrich
