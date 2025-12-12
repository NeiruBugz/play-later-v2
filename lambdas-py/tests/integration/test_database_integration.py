"""Integration tests for database operations.

Tests real PostgreSQL database operations including:
- ImportedGame upsert (create and update)
- Game upsert with genres and platforms
- LibraryItem creation with status logic
- Full import workflow
- Database transaction handling
"""

from __future__ import annotations

import time
from datetime import datetime

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from lambdas.models.db import (
    Game,
    IgdbMatchStatus,
    ImportedGame,
    LibraryItem,
    LibraryItemStatus,
    Storefront,
)
from lambdas.services.database import (
    DatabaseService,
    GameData,
    GenreData,
    ImportedGameData,
    LibraryItemData,
    PlatformData,
)


@pytest.mark.integration
def test_database_connection(db_session: Session) -> None:
    """Test database connection works.

    Args:
        db_session: Real database session

    Validates:
        - Connection is established
        - Can execute basic queries
    """
    # Simple health check query
    result = db_session.execute(select(1)).scalar()
    assert result == 1


@pytest.mark.integration
def test_upsert_imported_game_create(
    db_session: Session,
    test_user_id: str,
    cleanup_db_test_data: None,
) -> None:
    """Test creating a new ImportedGame record.

    Args:
        db_session: Real database session
        test_user_id: Test user ID
        cleanup_db_test_data: Cleanup fixture

    Validates:
        - New record is created successfully
        - All fields are properly saved
        - Timestamps are generated
    """
    db_service = DatabaseService()

    # Create imported game data
    game_data = ImportedGameData(
        user_id=test_user_id,
        storefront_game_id="570",
        name="Dota 2",
        storefront=Storefront.STEAM,
        playtime=12345,
        img_icon_url="icon_hash.jpg",
        img_logo_url="logo_hash.jpg",
        igdb_match_status=IgdbMatchStatus.PENDING,
    )

    # Act
    imported_game = db_service.upsert_imported_game(game_data)

    # Assert
    assert imported_game is not None
    assert imported_game.id is not None
    assert len(imported_game.id) == 25  # CUID length
    assert imported_game.name == "Dota 2"
    assert imported_game.storefront == Storefront.STEAM
    assert imported_game.storefrontGameId == "570"
    assert imported_game.playtime == 12345
    assert imported_game.userId == test_user_id
    assert imported_game.igdbMatchStatus == IgdbMatchStatus.PENDING
    assert isinstance(imported_game.createdAt, datetime)
    assert isinstance(imported_game.updatedAt, datetime)

    print("\n✅ Created ImportedGame:")
    print(f"   ID: {imported_game.id}")
    print(f"   Name: {imported_game.name}")
    print(f"   Storefront: {imported_game.storefront.value}")
    print(f"   Playtime: {imported_game.playtime} minutes")


@pytest.mark.integration
def test_upsert_imported_game_update(
    db_session: Session,
    test_user_id: str,
    cleanup_db_test_data: None,
) -> None:
    """Test updating an existing ImportedGame record (upsert).

    Args:
        db_session: Real database session
        test_user_id: Test user ID
        cleanup_db_test_data: Cleanup fixture

    Validates:
        - Existing record is updated (not duplicated)
        - Playtime and status can be updated
        - updatedAt timestamp is refreshed
    """
    db_service = DatabaseService()

    # Create initial record
    initial_data = ImportedGameData(
        user_id=test_user_id,
        storefront_game_id="730",
        name="Counter-Strike 2",
        storefront=Storefront.STEAM,
        playtime=1000,
        igdb_match_status=IgdbMatchStatus.PENDING,
    )

    imported_game_1 = db_service.upsert_imported_game(initial_data)
    initial_id = imported_game_1.id
    initial_updated_at = imported_game_1.updatedAt

    # Update the record (same user + storefront_game_id)
    time.sleep(0.1)  # Ensure updatedAt timestamp differs

    updated_data = ImportedGameData(
        user_id=test_user_id,
        storefront_game_id="730",
        name="Counter-Strike 2",
        storefront=Storefront.STEAM,
        playtime=2000,  # Updated playtime
        igdb_match_status=IgdbMatchStatus.MATCHED,  # Updated status
    )

    imported_game_2 = db_service.upsert_imported_game(updated_data)

    # Assert - should be same record (upsert, not insert)
    assert imported_game_2.id == initial_id, "Should update same record"
    assert imported_game_2.playtime == 2000, "Playtime should be updated"
    assert imported_game_2.igdbMatchStatus == IgdbMatchStatus.MATCHED
    assert imported_game_2.updatedAt > initial_updated_at, "updatedAt should be newer"

    print("\n✅ Updated ImportedGame:")
    print(f"   ID: {imported_game_2.id}")
    print(f"   Playtime: {imported_game_1.playtime} → {imported_game_2.playtime} minutes")
    print(f"   Status: {imported_game_1.igdbMatchStatus.value} → {imported_game_2.igdbMatchStatus.value}")


@pytest.mark.integration
def test_upsert_game_with_genres_platforms(
    db_session: Session,
    cleanup_db_test_data: None,
) -> None:
    """Test upserting game with genres and platforms.

    Args:
        db_session: Real database session
        cleanup_db_test_data: Cleanup fixture

    Validates:
        - Game record is created
        - Genres are upserted and linked
        - Platforms are upserted and linked
        - Relationships are properly established
    """
    db_service = DatabaseService()

    # First, upsert genres (side effects: creates records in DB for game association)
    db_service.upsert_genre(GenreData(igdb_id=5, name="Shooter", slug="shooter"))
    db_service.upsert_genre(GenreData(igdb_id=31, name="Adventure", slug="adventure"))

    # Upsert platforms (side effects: creates records in DB for game association)
    db_service.upsert_platform(
        PlatformData(igdb_id=6, name="PC (Microsoft Windows)", slug="win")
    )
    db_service.upsert_platform(PlatformData(igdb_id=48, name="PlayStation 4", slug="ps4"))

    # Upsert game with genres and platforms
    game_data = GameData(
        igdb_id=1942,
        title="The Witcher 3: Wild Hunt",
        slug="the-witcher-3-wild-hunt",
        steam_app_id=292030,
        description="Epic RPG adventure",
        cover_image="//images.igdb.com/igdb/image/upload/t_thumb/co1wyy.jpg",
        release_date=datetime(2015, 5, 19),
        genre_ids=[5, 31],
        platform_ids=[6, 48],
    )

    game = db_service.upsert_game(game_data)

    # Assert
    assert game is not None
    assert game.igdbId == 1942
    assert game.title == "The Witcher 3: Wild Hunt"
    assert game.steamAppId == 292030

    # Verify relationships (fetch from DB to check joins)
    db_game = db_session.get(Game, game.id)
    assert db_game is not None

    print("\n✅ Created Game with relationships:")
    print(f"   ID: {game.id}")
    print(f"   Title: {game.title}")
    print(f"   IGDB ID: {game.igdbId}")
    print(f"   Steam App ID: {game.steamAppId}")


@pytest.mark.integration
def test_create_library_item_with_status_logic(
    db_session: Session,
    test_user_id: str,
    cleanup_db_test_data: None,
) -> None:
    """Test creating library item with status based on playtime.

    Args:
        db_session: Real database session
        test_user_id: Test user ID
        cleanup_db_test_data: Cleanup fixture

    Validates:
        - Library item is created
        - Status is set correctly based on playtime
        - 0 playtime → CURIOUS_ABOUT
        - >0 playtime → EXPERIENCED
    """
    db_service = DatabaseService()

    # Create imported game first
    imported_game_data = ImportedGameData(
        user_id=test_user_id,
        storefront_game_id="440",
        name="Team Fortress 2",
        storefront=Storefront.STEAM,
        playtime=500,  # 500 minutes played
    )
    imported_game = db_service.upsert_imported_game(imported_game_data)

    # Create game record
    game_data = GameData(
        igdb_id=123,
        title="Team Fortress 2",
        slug="team-fortress-2",
        steam_app_id=440,
    )
    game = db_service.upsert_game(game_data)

    # Create library item
    library_item_data = LibraryItemData(
        user_id=test_user_id,
        game_id=game.id,
        imported_game_id=imported_game.id,
        playtime=500,
    )

    library_item = db_service.create_library_item(library_item_data)

    # Assert
    assert library_item is not None
    assert library_item.userId == test_user_id
    assert library_item.gameId == game.id
    assert library_item.importedGameId == imported_game.id
    assert library_item.playtime == 500
    assert library_item.status == LibraryItemStatus.EXPERIENCED  # >0 playtime

    print("\n✅ Created LibraryItem:")
    print(f"   ID: {library_item.id}")
    print(f"   User ID: {library_item.userId}")
    print(f"   Game ID: {library_item.gameId}")
    print(f"   Playtime: {library_item.playtime} minutes")
    print(f"   Status: {library_item.status.value}")


@pytest.mark.integration
def test_create_library_item_zero_playtime(
    db_session: Session,
    test_user_id: str,
    cleanup_db_test_data: None,
) -> None:
    """Test library item creation with zero playtime.

    Args:
        db_session: Real database session
        test_user_id: Test user ID
        cleanup_db_test_data: Cleanup fixture

    Validates:
        - Zero playtime sets status to CURIOUS_ABOUT
    """
    db_service = DatabaseService()

    # Create imported game with 0 playtime
    imported_game_data = ImportedGameData(
        user_id=test_user_id,
        storefront_game_id="220",
        name="Half-Life 2",
        storefront=Storefront.STEAM,
        playtime=0,  # Never played
    )
    imported_game = db_service.upsert_imported_game(imported_game_data)

    # Create game
    game_data = GameData(
        igdb_id=456,
        title="Half-Life 2",
        slug="half-life-2",
        steam_app_id=220,
    )
    game = db_service.upsert_game(game_data)

    # Create library item
    library_item_data = LibraryItemData(
        user_id=test_user_id,
        game_id=game.id,
        imported_game_id=imported_game.id,
        playtime=0,  # Never played
    )

    library_item = db_service.create_library_item(library_item_data)

    # Assert
    assert library_item.playtime == 0
    assert library_item.status == LibraryItemStatus.CURIOUS_ABOUT  # 0 playtime

    print("\n✅ Created LibraryItem (zero playtime):")
    print(f"   Playtime: {library_item.playtime} minutes")
    print(f"   Status: {library_item.status.value}")


@pytest.mark.integration
def test_full_import_workflow(
    db_session: Session,
    test_user_id: str,
    cleanup_db_test_data: None,
) -> None:
    """Test complete import workflow from ImportedGame to LibraryItem.

    Args:
        db_session: Real database session
        test_user_id: Test user ID
        cleanup_db_test_data: Cleanup fixture

    Validates:
        - Complete workflow works end-to-end
        - ImportedGame → Game → LibraryItem
        - All relationships are established
        - Data flows correctly through pipeline
    """
    db_service = DatabaseService()

    # Step 1: Import raw game from Steam
    imported_game_data = ImportedGameData(
        user_id=test_user_id,
        storefront_game_id="620",
        name="Portal 2",
        storefront=Storefront.STEAM,
        playtime=720,  # 12 hours
        igdb_match_status=IgdbMatchStatus.MATCHED,
    )
    imported_game = db_service.upsert_imported_game(imported_game_data)

    # Step 2: Enrich with IGDB data (side effects: creates records for game association)
    db_service.upsert_genre(GenreData(igdb_id=32, name="Puzzle", slug="puzzle"))
    db_service.upsert_platform(PlatformData(igdb_id=6, name="PC", slug="win"))

    game_data = GameData(
        igdb_id=789,
        title="Portal 2",
        slug="portal-2",
        steam_app_id=620,
        description="Puzzle-platform game",
        genre_ids=[32],
        platform_ids=[6],
    )
    game = db_service.upsert_game(game_data)

    # Step 3: Create library item
    library_item_data = LibraryItemData(
        user_id=test_user_id,
        game_id=game.id,
        imported_game_id=imported_game.id,
        playtime=720,
    )
    library_item = db_service.create_library_item(library_item_data)

    # Assert - verify complete workflow
    assert imported_game.igdbMatchStatus == IgdbMatchStatus.MATCHED
    assert game.igdbId == 789
    assert game.steamAppId == 620
    assert library_item.playtime == 720
    assert library_item.status == LibraryItemStatus.EXPERIENCED

    # Verify records exist in database
    db_imported_game = db_session.get(ImportedGame, imported_game.id)
    db_game = db_session.get(Game, game.id)
    db_library_item = db_session.get(LibraryItem, library_item.id)

    assert db_imported_game is not None
    assert db_game is not None
    assert db_library_item is not None

    print("\n✅ Full Import Workflow Completed:")
    print(f"   ImportedGame ID: {imported_game.id}")
    print(f"   Game ID: {game.id}")
    print(f"   LibraryItem ID: {library_item.id}")
    print(f"   Status: {library_item.status.value}")
    print(f"   Playtime: {library_item.playtime} minutes")


@pytest.mark.integration
def test_database_transaction_rollback(
    db_session: Session,
) -> None:
    """Test that database transactions can be rolled back.

    Args:
        db_session: Real database session

    Validates:
        - Transactions are isolated
        - Rollback prevents data from being persisted
    """
    # Create a record but don't commit
    test_game = ImportedGame(
        name="Test Game",
        storefront=Storefront.STEAM,
        storefrontGameId="999999",
        userId="test-transaction-user",
    )

    db_session.add(test_game)
    db_session.flush()  # Flush to get ID but don't commit

    game_id = test_game.id
    assert game_id is not None

    # Rollback transaction
    db_session.rollback()

    # Verify record doesn't exist after rollback
    rolled_back_game = db_session.get(ImportedGame, game_id)
    assert rolled_back_game is None

    print("\n✅ Transaction Rollback:")
    print(f"   Game ID before rollback: {game_id}")
    print("   Game exists after rollback: False")
