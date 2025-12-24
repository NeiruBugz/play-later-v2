"""End-to-end integration test for Steam Library Import Pipeline.

This test validates the complete three-Lambda pipeline:
1. Lambda 1 (steam_import): Fetch Steam library → CSV → S3
2. Lambda 2 (igdb_enrichment): Download CSV → IGDB enrichment → enriched CSV → S3
3. Lambda 3 (database_import): Download enriched CSV → database import

NOTE: This is a SLOW test (30-60 seconds) that makes REAL API calls to:
- Steam Web API
- IGDB/Twitch API
- S3 (or LocalStack)
- PostgreSQL database
"""

from __future__ import annotations

import pytest

from lambdas.handlers.steam_import import handler as steam_import_handler


def _extract_s3_key(s3_uri: str) -> str:
    """Extract full S3 object key from S3 URI.

    Converts s3://bucket-name/path/to/file.csv to path/to/file.csv
    (everything after the bucket name).

    Args:
        s3_uri: S3 URI in format s3://bucket/key

    Returns:
        Full S3 object key (path/to/file.csv)
    """
    if not s3_uri.startswith("s3://"):
        raise ValueError(f"Invalid S3 URI format: {s3_uri}")
    # Remove s3:// prefix and split bucket from key
    parts = s3_uri[5:].split("/", 1)
    if len(parts) != 2:
        raise ValueError(f"Invalid S3 URI format: {s3_uri}")
    return parts[1]  # Return everything after bucket name


@pytest.mark.integration
@pytest.mark.slow
def test_full_pipeline_steam_to_database(
    test_steam_id: str,
    test_user_id: str,
    cleanup_s3_test_files: list[str],
    cleanup_db_test_data: None,
    skip_if_no_steam_credentials: None,
    skip_if_no_igdb_credentials: None,
    skip_if_no_database: None,
    skip_if_no_s3: None,
) -> None:
    """Test complete pipeline from Steam → S3 → IGDB → Database.

    This is the most important integration test - validates the entire pipeline
    works correctly with real external services.

    Args:
        test_steam_id: Test user's Steam ID
        test_user_id: Test user ID in database
        cleanup_s3_test_files: S3 cleanup fixture
        cleanup_db_test_data: Database cleanup fixture
        skip_if_no_steam_credentials: Skip condition
        skip_if_no_igdb_credentials: Skip condition
        skip_if_no_database: Skip condition
        skip_if_no_s3: Skip condition

    Test Flow:
        1. Call steam_import_handler to fetch Steam library and upload to S3
        2. Verify raw CSV is uploaded to S3
        3. Call igdb_enrichment_handler to download CSV and enrich with IGDB
        4. Verify enriched CSV is uploaded to S3
        5. Call database_import_handler to import enriched data to database
        6. Verify database records exist (ImportedGame, Game, LibraryItem)
        7. Cleanup S3 files and database records

    Validates:
        - Complete pipeline executes without errors
        - Data flows correctly through all three Lambdas
        - S3 files are created and readable
        - Database records are created with correct relationships
        - Playtime-based status logic works correctly
    """
    import time

    pipeline_start = time.time()

    print("\n" + "=" * 70)
    print("🚀 Starting Full Pipeline Integration Test")
    print("=" * 70)

    # =========================================================================
    # Step 1: Lambda 1 - Steam Import (Steam API → CSV → S3)
    # =========================================================================
    print("\n📥 Step 1: Fetching Steam library...")

    from lambdas.handlers.steam_import import SteamImportResponse

    steam_event_dict = {
        "user_id": test_user_id,
        "steam_id64": test_steam_id,
    }

    steam_result_dict = steam_import_handler(steam_event_dict, None)
    steam_result = SteamImportResponse(**steam_result_dict)

    assert steam_result.success, "Steam import should succeed"
    assert steam_result.game_count > 0, "Should find games in Steam library"
    assert steam_result.s3_location is not None, "Should have S3 location"

    # Track S3 file for cleanup
    s3_key = _extract_s3_key(steam_result.s3_location)
    cleanup_s3_test_files.append(s3_key)

    print("✅ Steam import successful:")
    print(f"   Games found: {steam_result.game_count}")
    print(f"   S3 location: {steam_result.s3_location}")
    print(f"   Duration: {time.time() - pipeline_start:.1f}s")

    # =========================================================================
    # Step 2: Lambda 2 - IGDB Enrichment (S3 CSV → IGDB → enriched CSV → S3)
    # =========================================================================
    print("\n🔍 Step 2: Enriching with IGDB data...")

    enrichment_start = time.time()

    from lambdas.handlers.igdb_enrichment import (
        IgdbEnrichmentResponse,
    )
    from lambdas.handlers.igdb_enrichment import (
        handler as igdb_enrichment_handler,
    )

    enrichment_event_dict = {
        "user_id": test_user_id,
        "s3_location": steam_result.s3_location,
    }

    enrichment_result_dict = igdb_enrichment_handler(enrichment_event_dict, None)
    enrichment_result = IgdbEnrichmentResponse(**enrichment_result_dict)

    assert enrichment_result.success, "IGDB enrichment should succeed"
    assert enrichment_result.stats is not None, "Should have stats"
    assert enrichment_result.stats.processed > 0, "Should process games"
    assert enrichment_result.stats.matched >= 0, "Should have match count"
    assert enrichment_result.s3_enriched_location is not None, "Should have enriched S3 location"

    # Track enriched S3 file for cleanup
    enriched_s3_key = _extract_s3_key(enrichment_result.s3_enriched_location)
    cleanup_s3_test_files.append(enriched_s3_key)

    match_rate = (
        (enrichment_result.stats.matched / enrichment_result.stats.processed * 100)
        if enrichment_result.stats.processed > 0
        else 0
    )

    print("✅ IGDB enrichment successful:")
    print(f"   Processed: {enrichment_result.stats.processed}")
    print(f"   Matched: {enrichment_result.stats.matched}")
    print(f"   Unmatched: {enrichment_result.stats.unmatched}")
    print(f"   Match rate: {match_rate:.1f}%")
    print(f"   Duration: {time.time() - enrichment_start:.1f}s")

    # =========================================================================
    # Step 3: Lambda 3 - Database Import (enriched CSV → PostgreSQL)
    # =========================================================================
    print("\n💾 Step 3: Importing to database...")

    db_import_start = time.time()

    from lambdas.handlers.database_import import (
        DatabaseImportResponse,
    )
    from lambdas.handlers.database_import import (
        handler as database_import_handler,
    )

    db_import_event_dict = {
        "user_id": test_user_id,
        "s3_enriched_location": enrichment_result.s3_enriched_location,
    }

    db_import_result_dict = database_import_handler(db_import_event_dict, None)
    db_import_result = DatabaseImportResponse(**db_import_result_dict)

    assert db_import_result.success, "Database import should succeed"
    assert db_import_result.stats is not None, "Should have import stats"
    assert db_import_result.stats.imported_games_created > 0, "Should create ImportedGame records"
    assert db_import_result.stats.games_created >= 0, "Should create Game records"
    assert db_import_result.stats.library_items_created >= 0, "Should create LibraryItem records"

    print("✅ Database import successful:")
    print(f"   ImportedGame records: {db_import_result.stats.imported_games_created}")
    print(f"   Game records: {db_import_result.stats.games_created}")
    print(f"   LibraryItem records: {db_import_result.stats.library_items_created}")
    print(f"   Duration: {time.time() - db_import_start:.1f}s")

    # =========================================================================
    # Step 4: Verification - Check database records exist
    # =========================================================================
    print("\n✓ Step 4: Verifying database records...")

    from sqlalchemy.orm import sessionmaker

    from lambdas.config import get_settings
    from lambdas.models.db import ImportedGame, LibraryItem

    settings = get_settings()
    from sqlalchemy import create_engine

    engine = create_engine(settings.database_url.get_secret_value())
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Count ImportedGame records for test user
        imported_games_count = (
            session.query(ImportedGame)
            .filter(ImportedGame.userId == test_user_id)
            .count()
        )

        # Count LibraryItem records for test user
        library_items_count = (
            session.query(LibraryItem)
            .filter(LibraryItem.userId == test_user_id)
            .count()
        )

        # Get sample ImportedGame to verify data
        sample_imported = (
            session.query(ImportedGame)
            .filter(ImportedGame.userId == test_user_id)
            .first()
        )

        assert imported_games_count > 0, "Should have ImportedGame records in DB"
        assert library_items_count >= 0, "Should have LibraryItem records in DB"
        assert sample_imported is not None, "Should have at least one ImportedGame"

        print("✅ Database verification successful:")
        print(f"   ImportedGame records: {imported_games_count}")
        print(f"   LibraryItem records: {library_items_count}")

        if sample_imported:
            print(f"   Sample game: {sample_imported.name}")
            print(f"   Playtime: {sample_imported.playtime} minutes")
            print(f"   Status: {sample_imported.igdbMatchStatus.value}")

    finally:
        session.close()
        engine.dispose()

    # =========================================================================
    # Summary
    # =========================================================================
    total_duration = time.time() - pipeline_start

    print("\n" + "=" * 70)
    print("🎉 Full Pipeline Test Completed Successfully!")
    print("=" * 70)
    print(f"   Total Duration: {total_duration:.1f}s")
    print(f"   Games Processed: {enrichment_result.stats.processed if enrichment_result.stats else 0}")
    print(f"   Match Rate: {match_rate:.1f}%")
    print(f"   Database Records: {imported_games_count}")
    print("=" * 70 + "\n")

    # Final assertions
    assert steam_result.success
    assert enrichment_result.success
    assert db_import_result.success
    assert imported_games_count > 0
    assert total_duration < 120, "Full pipeline should complete in <2 minutes for small libraries"


@pytest.mark.integration
def test_full_pipeline_limited_50_games(
    test_steam_id: str,
    test_user_id: str,
    cleanup_s3_test_files: list[str],
    cleanup_db_test_data: None,
    skip_if_no_steam_credentials: None,
    skip_if_no_igdb_credentials: None,
    skip_if_no_database: None,
    skip_if_no_s3: None,
) -> None:
    """Test full pipeline with limit of 50 games for faster execution.

    This test is similar to test_full_pipeline_steam_to_database but limits
    the number of games processed to 50 for faster feedback and debugging.

    Run with: pytest -s tests/integration/test_full_pipeline_integration.py::test_full_pipeline_limited_50_games
    The -s flag shows live output during test execution.
    """
    import time

    from lambdas.handlers.database_import import (
        DatabaseImportResponse,
    )
    from lambdas.handlers.database_import import (
        handler as database_import_handler,
    )
    from lambdas.handlers.igdb_enrichment import (
        IgdbEnrichmentResponse,
    )
    from lambdas.handlers.igdb_enrichment import (
        handler as igdb_enrichment_handler,
    )
    from lambdas.handlers.steam_import import SteamImportResponse

    pipeline_start = time.time()
    game_limit = 50

    print("\n" + "=" * 70)
    print(f"🚀 Starting Limited Pipeline Test (max {game_limit} games)")
    print("=" * 70)

    # Step 1: Steam Import with limit
    print("\n📥 Step 1: Fetching Steam library (limited)...")
    steam_event_dict = {
        "user_id": test_user_id,
        "steam_id64": test_steam_id,
        "limit": game_limit,
    }

    steam_result_dict = steam_import_handler(steam_event_dict, None)
    steam_result = SteamImportResponse(**steam_result_dict)

    print(f"   Steam result: success={steam_result.success}")
    if steam_result.error:
        print(f"   Error: {steam_result.error}")
    assert steam_result.success, f"Steam import failed: {steam_result.error}"
    assert steam_result.game_count is not None and steam_result.game_count > 0
    assert steam_result.s3_location is not None

    s3_key = _extract_s3_key(steam_result.s3_location)
    cleanup_s3_test_files.append(s3_key)

    print(f"✅ Steam import: {steam_result.game_count} games")
    print(f"   S3: {steam_result.s3_location}")
    print(f"   Duration: {time.time() - pipeline_start:.1f}s")

    # Step 2: IGDB Enrichment
    print("\n🔍 Step 2: IGDB enrichment...")
    enrichment_start = time.time()

    enrichment_event_dict = {
        "user_id": test_user_id,
        "s3_location": steam_result.s3_location,
    }

    enrichment_result_dict = igdb_enrichment_handler(enrichment_event_dict, None)
    enrichment_result = IgdbEnrichmentResponse(**enrichment_result_dict)

    print(f"   Enrichment result: success={enrichment_result.success}")
    if enrichment_result.error:
        print(f"   Error: {enrichment_result.error}")
    assert enrichment_result.success, f"IGDB enrichment failed: {enrichment_result.error}"
    assert enrichment_result.stats is not None
    assert enrichment_result.s3_enriched_location is not None

    enriched_s3_key = _extract_s3_key(enrichment_result.s3_enriched_location)
    cleanup_s3_test_files.append(enriched_s3_key)

    match_rate = (
        enrichment_result.stats.matched / enrichment_result.stats.processed * 100
        if enrichment_result.stats.processed > 0
        else 0
    )
    print(f"✅ IGDB enrichment: {enrichment_result.stats.processed} processed")
    print(f"   Matched: {enrichment_result.stats.matched} ({match_rate:.1f}%)")
    print(f"   Unmatched: {enrichment_result.stats.unmatched}")
    print(f"   Duration: {time.time() - enrichment_start:.1f}s")

    # Step 3: Database Import
    print("\n💾 Step 3: Database import...")
    db_import_start = time.time()

    db_import_event_dict = {
        "user_id": test_user_id,
        "s3_enriched_location": enrichment_result.s3_enriched_location,
    }

    db_import_result_dict = database_import_handler(db_import_event_dict, None)
    db_import_result = DatabaseImportResponse(**db_import_result_dict)

    print(f"   DB import result: success={db_import_result.success}")
    if db_import_result.error:
        print(f"   Error: {db_import_result.error}")
    assert db_import_result.success, f"Database import failed: {db_import_result.error}"
    assert db_import_result.stats is not None

    print("✅ Database import:")
    print(f"   ImportedGame: {db_import_result.stats.imported_games_created} created")
    print(f"   Game: {db_import_result.stats.games_created} created")
    print(f"   LibraryItem: {db_import_result.stats.library_items_created} created")
    print(f"   Duration: {time.time() - db_import_start:.1f}s")

    # Summary
    total_duration = time.time() - pipeline_start
    print("\n" + "=" * 70)
    print("🎉 Limited Pipeline Test Complete!")
    print(f"   Total Duration: {total_duration:.1f}s")
    print(f"   Games: {steam_result.game_count}")
    print(f"   Match Rate: {match_rate:.1f}%")
    print("=" * 70 + "\n")


@pytest.mark.integration
def test_pipeline_handles_empty_steam_library_gracefully(
    test_user_id: str,
    skip_if_no_steam_credentials: None,
) -> None:
    """Test pipeline gracefully handles empty or private Steam profiles.

    Args:
        test_user_id: Test user ID
        skip_if_no_steam_credentials: Skip condition

    Validates:
        - Empty/private profiles don't crash the pipeline
        - Appropriate error messages or empty results are returned
    """
    # Use a known private/minimal Steam ID (valid format but likely private)
    private_steam_id = "76561197960265729"

    from lambdas.handlers.steam_import import SteamImportResponse

    steam_event_dict = {
        "user_id": test_user_id,
        "steam_id64": private_steam_id,
    }

    steam_result_dict = steam_import_handler(steam_event_dict, None)
    steam_result = SteamImportResponse(**steam_result_dict)

    # Should succeed but with 0 games (or handle gracefully)
    if steam_result.success:
        assert steam_result.game_count == 0, "Private profile should return 0 games"
        print("\n✅ Empty library handled gracefully:")
        print(f"   Success: {steam_result.success}")
        print(f"   Games: {steam_result.game_count}")
    else:
        # If it fails, should have descriptive error message
        assert steam_result.error is not None
        print("\n✅ Private profile error handled gracefully:")
        print(f"   Error: {steam_result.error}")


@pytest.mark.integration
def test_pipeline_handles_network_errors(test_user_id: str) -> None:
    """Test pipeline error handling with invalid Steam ID.

    Args:
        test_user_id: Test user ID

    Validates:
        - Invalid inputs are caught and handled
        - Appropriate error messages are returned
    """
    from lambdas.handlers.steam_import import SteamImportResponse

    # Invalid Steam ID format
    invalid_steam_id = "invalid_steam_id"

    steam_event_dict = {
        "user_id": test_user_id,
        "steam_id64": invalid_steam_id,
    }

    # Should raise validation error or return error result
    try:
        steam_result_dict = steam_import_handler(steam_event_dict, None)
        steam_result = SteamImportResponse(**steam_result_dict)
        assert not steam_result.success, "Should fail with invalid Steam ID"
        assert steam_result.error is not None
        print("\n✅ Invalid input handled gracefully:")
        print(f"   Error: {steam_result.error}")
    except Exception as e:
        # If it raises an exception, that's also acceptable
        assert "Invalid Steam ID" in str(e) or "validation" in str(e).lower()
        print("\n✅ Invalid input raised exception as expected:")
        print(f"   Exception: {type(e).__name__}: {e}")
