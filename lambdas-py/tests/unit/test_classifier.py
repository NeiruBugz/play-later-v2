from __future__ import annotations

import pytest

from lambdas.services.classifier import (
    AppClassification,
    ClassificationResult,
    classify_steam_app,
    is_game,
)


class TestClassifyDLC:
    """Test DLC classification patterns."""

    @pytest.mark.parametrize(
        "name",
        [
            "Dark Souls III - Season Pass",
            "Game Name - DLC",
            "Some Game - Expansion Pack",
            "Game: The Expansion",
            "Game Name Expansion",
            "Witcher 3 - Season Pass",
            "Cyberpunk 2077 - DLC",
            "Elden Ring Expansion Pack",
        ],
    )
    def test_dlc_patterns(self, name: str) -> None:
        result = classify_steam_app(name)
        assert result.classification == AppClassification.DLC
        assert result.should_enrich is False
        assert result.matched_pattern is not None


class TestClassifySoundtrack:
    """Test soundtrack classification patterns."""

    @pytest.mark.parametrize(
        "name",
        [
            "Game Name - Soundtrack",
            "Game Name OST",
            "Game Name - Original Soundtrack",
            "Hollow Knight - Soundtrack",
            "Hades - OST",
            "Celeste Original Soundtrack",
        ],
    )
    def test_soundtrack_patterns(self, name: str) -> None:
        result = classify_steam_app(name)
        assert result.classification == AppClassification.SOUNDTRACK
        assert result.should_enrich is False
        assert result.matched_pattern is not None


class TestClassifyDemo:
    """Test demo classification patterns."""

    @pytest.mark.parametrize(
        "name",
        [
            "Game Name Demo",
            "Game Name - Demo",
            "Game Name (Demo)",
            "Resident Evil Village Demo",
            "Cyberpunk 2077 - Demo",
        ],
    )
    def test_demo_patterns(self, name: str) -> None:
        result = classify_steam_app(name)
        assert result.classification == AppClassification.DEMO
        assert result.should_enrich is False
        assert result.matched_pattern is not None


class TestClassifyTool:
    """Test tool/SDK classification patterns."""

    @pytest.mark.parametrize(
        "name",
        [
            "Game Name Dedicated Server",
            "Game Name - SDK",
            "Game Name Editor",
            "Game Name - Level Editor",
            "Game Name Mod Tool",
            "Counter-Strike Dedicated Server",
            "Unreal Engine - SDK",
            "Skyrim - Editor",
        ],
    )
    def test_tool_patterns(self, name: str) -> None:
        result = classify_steam_app(name)
        assert result.classification == AppClassification.TOOL
        assert result.should_enrich is False
        assert result.matched_pattern is not None


class TestClassifyMultiplayer:
    """Test multiplayer component classification."""

    @pytest.mark.parametrize(
        "name",
        [
            "Game Name - Multiplayer",
            "Game Name - Multi-Player",
            "Game Name Multiplayer",
            "Halo - Multiplayer",
            "Call of Duty - Multi-Player",
        ],
    )
    def test_multiplayer_patterns(self, name: str) -> None:
        result = classify_steam_app(name)
        assert result.classification == AppClassification.MULTIPLAYER_COMPONENT
        assert result.should_enrich is False
        assert result.matched_pattern is not None


class TestClassifyVideo:
    """Test video/trailer classification."""

    @pytest.mark.parametrize(
        "name",
        [
            "Game Name - Trailer",
            "Game Name Trailer",
            "Game Name - Announce Trailer",
            "Cyberpunk 2077 - Trailer",
            "Elden Ring Announce Trailer",
        ],
    )
    def test_video_patterns(self, name: str) -> None:
        result = classify_steam_app(name)
        assert result.classification == AppClassification.VIDEO
        assert result.should_enrich is False
        assert result.matched_pattern is not None


class TestClassifyBonusContent:
    """Test bonus content classification."""

    @pytest.mark.parametrize(
        "name",
        [
            "Game Name - Artbook",
            "Game Name - Art Book",
            "Game Name Digital Artbook",
            "Game Name - Bonus Content",
            "Game Name Digital Deluxe Content",
            "Witcher 3 - Art Book",
            "Cyberpunk 2077 Digital Artbook",
            "Hades Bonus Content",
        ],
    )
    def test_bonus_patterns(self, name: str) -> None:
        result = classify_steam_app(name)
        assert result.classification == AppClassification.BONUS_CONTENT
        assert result.should_enrich is False
        assert result.matched_pattern is not None


class TestClassifyBeta:
    """Test beta/playtest classification."""

    @pytest.mark.parametrize(
        "name",
        [
            "Game Name Playtest",
            "Game Name - Playtest",
            "Game Name Beta",
            "Game Name - Beta",
            "Game Name Test",
            "Valorant Playtest",
            "Deadlock - Beta",
        ],
    )
    def test_beta_patterns(self, name: str) -> None:
        result = classify_steam_app(name)
        assert result.classification == AppClassification.BETA
        assert result.should_enrich is False
        assert result.matched_pattern is not None


class TestClassifyGame:
    """Test that actual games are correctly classified."""

    @pytest.mark.parametrize(
        "name",
        [
            "Dark Souls III",
            "The Witcher 3: Wild Hunt",
            "Cyberpunk 2077",
            "Stardew Valley",
            "Hollow Knight",
            "Hades",
            "Elden Ring",
            "Portal 2",
            "Half-Life 2",
            "Counter-Strike 2",
            "Dota 2",
            "Team Fortress 2",
            "Baldur's Gate 3",
            "Red Dead Redemption 2",
            "God of War",
            "The Last of Us Part I",
            "Sekiro: Shadows Die Twice",
            "Bloodborne",
        ],
    )
    def test_game_patterns(self, name: str) -> None:
        result = classify_steam_app(name)
        assert result.classification == AppClassification.GAME
        assert result.should_enrich is True
        assert result.matched_pattern is None


class TestEdgeCases:
    """Test edge cases and special scenarios."""

    def test_none_name(self) -> None:
        result = classify_steam_app(None)
        assert result.classification == AppClassification.GAME
        assert result.should_enrich is False
        assert result.matched_pattern == "empty or None name"

    def test_empty_name(self) -> None:
        result = classify_steam_app("")
        assert result.classification == AppClassification.GAME
        assert result.should_enrich is False
        assert result.matched_pattern == "empty or None name"

    def test_whitespace_only_name(self) -> None:
        result = classify_steam_app("   ")
        assert result.classification == AppClassification.GAME
        assert result.should_enrich is False
        assert result.matched_pattern == "empty or None name"

    def test_case_insensitive(self) -> None:
        assert classify_steam_app("GAME - DLC").classification == AppClassification.DLC
        assert classify_steam_app("game - dlc").classification == AppClassification.DLC
        assert classify_steam_app("Game - Dlc").classification == AppClassification.DLC
        assert (
            classify_steam_app("GAME - SOUNDTRACK").classification
            == AppClassification.SOUNDTRACK
        )
        assert (
            classify_steam_app("game - soundtrack").classification
            == AppClassification.SOUNDTRACK
        )

    def test_soundtrack_as_compound_word(self) -> None:
        """Games with 'soundtrack' as part of a compound word should be games."""
        result = classify_steam_app("Soundtracker Pro")
        assert result.classification == AppClassification.GAME
        assert result.should_enrich is True

    def test_demo_in_game_title(self) -> None:
        """Games with 'Demo' in the title but not as a suffix should be games."""
        result = classify_steam_app("Demolition Derby")
        assert result.classification == AppClassification.GAME
        assert result.should_enrich is True

    def test_multiplayer_in_compound_word(self) -> None:
        """Games with 'multiplayer' as part of a compound word should be games."""
        result = classify_steam_app("Multiplayerz")
        assert result.classification == AppClassification.GAME
        assert result.should_enrich is True

    def test_pattern_precedence(self) -> None:
        """Test that more specific patterns match first."""
        result = classify_steam_app("Game - Multiplayer")
        assert result.classification == AppClassification.MULTIPLAYER_COMPONENT

        result = classify_steam_app("Game - DLC")
        assert result.classification == AppClassification.DLC

    def test_result_repr(self) -> None:
        """Test string representation of ClassificationResult."""
        result = ClassificationResult(
            AppClassification.GAME, should_enrich=True, matched_pattern=None
        )
        assert repr(result) == "ClassificationResult(game, enrich=True)"

        result = ClassificationResult(
            AppClassification.DLC, should_enrich=False, matched_pattern="DLC marker"
        )
        assert repr(result) == "ClassificationResult(dlc, enrich=False)"


class TestIsGameHelper:
    """Test the is_game convenience function."""

    def test_returns_true_for_games(self) -> None:
        assert is_game("Dark Souls III") is True
        assert is_game("The Witcher 3") is True
        assert is_game("Cyberpunk 2077") is True

    def test_returns_false_for_dlc(self) -> None:
        assert is_game("Dark Souls III - Season Pass") is False
        assert is_game("Game - DLC") is False

    def test_returns_false_for_soundtrack(self) -> None:
        assert is_game("Game - Soundtrack") is False
        assert is_game("Game OST") is False

    def test_returns_false_for_demo(self) -> None:
        assert is_game("Game Demo") is False
        assert is_game("Game - Demo") is False

    def test_returns_false_for_none(self) -> None:
        assert is_game(None) is False

    def test_returns_false_for_empty(self) -> None:
        assert is_game("") is False
        assert is_game("   ") is False


class TestRealWorldExamples:
    """Test with real Steam app names from the Steam store."""

    @pytest.mark.parametrize(
        ("name", "expected_classification", "should_enrich"),
        [
            # Real games
            ("Counter-Strike 2", AppClassification.GAME, True),
            ("Dota 2", AppClassification.GAME, True),
            ("Apex Legends", AppClassification.GAME, True),
            ("PUBG: BATTLEGROUNDS", AppClassification.GAME, True),
            ("Grand Theft Auto V", AppClassification.GAME, True),
            # Real DLC
            (
                "The Witcher 3: Wild Hunt - Blood and Wine",
                AppClassification.DLC,
                False,
            ),
            ("Cyberpunk 2077: Phantom Liberty", AppClassification.DLC, False),
            ("Elden Ring - Shadow of the Erdtree", AppClassification.DLC, False),
            # Real soundtracks
            ("Hollow Knight - Soundtrack", AppClassification.SOUNDTRACK, False),
            ("DOOM Eternal OST", AppClassification.SOUNDTRACK, False),
            # Real tools
            ("Counter-Strike Dedicated Server", AppClassification.TOOL, False),
            ("Source SDK", AppClassification.TOOL, False),
        ],
    )
    def test_real_steam_apps(
        self, name: str, expected_classification: AppClassification, should_enrich: bool
    ) -> None:
        result = classify_steam_app(name)
        assert result.classification == expected_classification
        assert result.should_enrich == should_enrich
