-- Spec 029 review fixtures for audit_full. LOCAL DB ONLY. Apply after the 026 seed (capture's --reseed does this).
-- Run: docker exec -i savepoint-postgres psql -v ON_ERROR_STOP=1 -U postgres -d savepoint-db < review-fixtures.sql
-- Idempotent: fixture games are keyed by igdbId 900029001..900029016 and re-dated relative to CURRENT_DATE on every run.
-- Every fixture sets releaseDateCheckedAt = now() (except the legacy row), so a refresh on Home or Library leaves it alone.
-- Dates satisfy the Game CHECK constraints: day dates at UTC midnight, month / quarter / year dates on the first day of
-- the period, TBA and no-date rows without a releaseDate, and moved from/at set together.
--
-- Fixture                              date                          precision  library item
--   Out Today                          today                         DAY        Want, owned
--   Tomorrow                           today + 1                     DAY        Playing, owned
--   Nine Days Alpha / Bravo            today + 9 (two games, A to Z) DAY        Alpha: Want, owned, Up Next 5. Bravo: Want, Not owned
--   Thirty Days                        today + 30                    DAY        Done, owned
--   Thirty-One Days                    today + 31                    DAY        Want, owned
--   Second of January                  2 January of next year        DAY        Want, owned
--   Month Only / Quarter Only / Year Only  first day of the period   MONTH / QUARTER / YEAR   Want, owned
--   TBA                                NULL                          TBA        Want, owned
--   No Date                            NULL                          NULL       Want, owned
--   Released Last Year                 2 June of last year           DAY        Done, owned
--   Moved 3 Days Ago / 20 Days Ago     today + 45 / today + 60       DAY        Want, owned (moved-from set, moved-at 3 / 20 days back)
--   Legacy Unchecked                   today + 14                    NULL       Want, owned (checkedAt NULL: a legacy row, refreshed on first open)
--   Netherwake (igdbId 349703)         today + 9                     DAY        none (real IGDB id and slug: the game page finds it in IGDB, the stored date and precision win)
--   Neon District (igdbId 124201)      NULL                          TBA        none (real IGDB id and slug, as Netherwake)
-- The two real-slug rows are not in the 900029001..900029016 range: when a real "add game" already created them, a re-run
-- overwrites only their release fields (date, precision, checkedAt, moved pair) and leaves title and the rest untouched.

DO $$
DECLARE
  full_id         text := (SELECT id FROM "user" WHERE email = 'audit_full@savepoint.local');
  this_year       int  := extract(year FROM CURRENT_DATE)::int;
  fixture_cover_a text := 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2y6s.jpg';
  fixture_cover_b text := 'https://images.igdb.com/igdb/image/upload/t_cover_big/co20n4.jpg';
  fixture_cover_c text := 'https://images.igdb.com/igdb/image/upload/t_cover_big/coctc7.jpg';
  row             record;
BEGIN
  IF full_id IS NULL THEN
    RAISE EXCEPTION 'audit_full missing: sign it up and run the 026 seed first';
  END IF;

  FOR row IN SELECT * FROM (VALUES
    -- igdbId, title, slug, cover, releaseDate, precision, checked, movedFrom, movedDaysAgo, status, owned, upNextPosition
    (900029001, 'Release Fixture: Out Today',          'release-fixture-out-today',          fixture_cover_a, (CURRENT_DATE)::timestamp,       'DAY',     true,  NULL::timestamp,             NULL::int, 'WANT',    true,  NULL::int),
    (900029002, 'Release Fixture: Tomorrow',           'release-fixture-tomorrow',           fixture_cover_b, (CURRENT_DATE + 1)::timestamp,   'DAY',     true,  NULL,                        NULL,      'PLAYING', true,  NULL),
    (900029003, 'Release Fixture: Nine Days Alpha',    'release-fixture-nine-days-alpha',    fixture_cover_c, (CURRENT_DATE + 9)::timestamp,   'DAY',     true,  NULL,                        NULL,      'WANT',    true,  5),
    (900029004, 'Release Fixture: Nine Days Bravo',    'release-fixture-nine-days-bravo',    fixture_cover_a, (CURRENT_DATE + 9)::timestamp,   'DAY',     true,  NULL,                        NULL,      'WANT',    false, NULL),
    (900029005, 'Release Fixture: Thirty Days',        'release-fixture-thirty-days',        fixture_cover_b, (CURRENT_DATE + 30)::timestamp,  'DAY',     true,  NULL,                        NULL,      'DONE',    true,  NULL),
    (900029006, 'Release Fixture: Thirty-One Days',    'release-fixture-thirty-one-days',    fixture_cover_c, (CURRENT_DATE + 31)::timestamp,  'DAY',     true,  NULL,                        NULL,      'WANT',    true,  NULL),
    (900029007, 'Release Fixture: Second of January',  'release-fixture-second-of-january',  fixture_cover_a, make_date(this_year + 1, 1, 2)::timestamp, 'DAY', true, NULL,                  NULL,      'WANT',    true,  NULL),
    (900029008, 'Release Fixture: Month Only',         'release-fixture-month-only',         fixture_cover_b, date_trunc('month', CURRENT_DATE + interval '2 months'),    'MONTH',   true, NULL,   NULL,      'WANT',    true,  NULL),
    (900029009, 'Release Fixture: Quarter Only',       'release-fixture-quarter-only',       fixture_cover_c, date_trunc('quarter', CURRENT_DATE + interval '6 months'),  'QUARTER', true, NULL,   NULL,      'WANT',    true,  NULL),
    (900029010, 'Release Fixture: Year Only',          'release-fixture-year-only',          fixture_cover_a, make_date(this_year + 1, 1, 1)::timestamp, 'YEAR', true, NULL,                 NULL,      'WANT',    true,  NULL),
    (900029011, 'Release Fixture: TBA',                'release-fixture-tba',                fixture_cover_b, NULL,                            'TBA',     true,  NULL,                        NULL,      'WANT',    true,  NULL),
    (900029012, 'Release Fixture: No Date',            'release-fixture-no-date',            fixture_cover_c, NULL,                            NULL,      true,  NULL,                        NULL,      'WANT',    true,  NULL),
    (900029013, 'Release Fixture: Released Last Year', 'release-fixture-released-last-year', fixture_cover_a, make_date(this_year - 1, 6, 2)::timestamp, 'DAY', true, NULL,                   NULL,      'DONE',    true,  NULL),
    (900029014, 'Release Fixture: Moved 3 Days Ago',   'release-fixture-moved-3-days-ago',   fixture_cover_b, (CURRENT_DATE + 45)::timestamp,  'DAY',     true,  (CURRENT_DATE + 20)::timestamp, 3,     'WANT',    true,  NULL),
    (900029015, 'Release Fixture: Moved 20 Days Ago',  'release-fixture-moved-20-days-ago',  fixture_cover_c, (CURRENT_DATE + 60)::timestamp,  'DAY',     true,  (CURRENT_DATE + 35)::timestamp, 20,    'WANT',    true,  NULL),
    (900029016, 'Release Fixture: Legacy Unchecked',   'release-fixture-legacy-unchecked',   fixture_cover_a, (CURRENT_DATE + 14)::timestamp,  NULL,      false, NULL,                        NULL,      'WANT',    true,  NULL)
  ) AS t(igdb, title, slug, cover, release_date, release_precision, checked, moved_from, moved_days_ago, status, owned, up_next)
  LOOP
    INSERT INTO "Game" (id, "igdbId", title, slug, "coverImage", "releaseDate", "releaseDatePrecision", "releaseDateCheckedAt",
                        "releaseDateMovedFrom", "releaseDateMovedAt", "updatedAt")
    VALUES ('release-fixture-' || row.igdb, row.igdb, row.title, row.slug, row.cover, row.release_date,
            row.release_precision::"ReleaseDatePrecision",
            CASE WHEN row.checked THEN now() END,
            row.moved_from,
            CASE WHEN row.moved_days_ago IS NOT NULL THEN now() - make_interval(days => row.moved_days_ago) END,
            now())
    ON CONFLICT ("igdbId") DO UPDATE SET
      title = EXCLUDED.title, slug = EXCLUDED.slug, "coverImage" = EXCLUDED."coverImage",
      "releaseDate" = EXCLUDED."releaseDate", "releaseDatePrecision" = EXCLUDED."releaseDatePrecision",
      "releaseDateCheckedAt" = EXCLUDED."releaseDateCheckedAt",
      "releaseDateMovedFrom" = EXCLUDED."releaseDateMovedFrom", "releaseDateMovedAt" = EXCLUDED."releaseDateMovedAt",
      "updatedAt" = now();

    UPDATE "LibraryItem" SET "upNextPosition" = NULL
    WHERE "userId" = full_id AND row.up_next IS NOT NULL AND "upNextPosition" = row.up_next
      AND "gameId" <> (SELECT id FROM "Game" WHERE "igdbId" = row.igdb);

    INSERT INTO "LibraryItem" ("userId", "gameId", status, platform, "hasBeenPlayed", "isOwned", "upNextPosition",
                               "startedAt", "completedAt", "createdAt", "updatedAt", "statusChangedAt")
    SELECT full_id, g.id, row.status::"LibraryItemStatus", 'PC', row.status <> 'WANT', row.owned, row.up_next,
           CASE WHEN row.status <> 'WANT' THEN now() - interval '10 days' END,
           CASE WHEN row.status = 'DONE' THEN now() - interval '2 days' END,
           now() - interval '12 days', now(), now() - interval '2 days'
    FROM "Game" g WHERE g."igdbId" = row.igdb
    ON CONFLICT ("userId", "gameId") DO UPDATE SET
      status = EXCLUDED.status, "isOwned" = EXCLUDED."isOwned", "upNextPosition" = EXCLUDED."upNextPosition",
      "hasBeenPlayed" = EXCLUDED."hasBeenPlayed", "startedAt" = EXCLUDED."startedAt", "completedAt" = EXCLUDED."completedAt",
      "updatedAt" = now();
  END LOOP;

  FOR row IN SELECT * FROM (VALUES
    -- igdbId, title, slug, releaseDate, precision
    (349703, 'Netherwake',    'netherwake',    (CURRENT_DATE + 9)::timestamp, 'DAY'),
    (124201, 'Neon District', 'neon-district', NULL::timestamp,               'TBA')
  ) AS t(igdb, title, slug, release_date, release_precision)
  LOOP
    INSERT INTO "Game" (id, "igdbId", title, slug, "releaseDate", "releaseDatePrecision", "releaseDateCheckedAt", "updatedAt")
    VALUES ('release-fixture-real-' || row.igdb, row.igdb, row.title, row.slug, row.release_date,
            row.release_precision::"ReleaseDatePrecision", now(), now())
    ON CONFLICT ("igdbId") DO UPDATE SET
      "releaseDate" = EXCLUDED."releaseDate", "releaseDatePrecision" = EXCLUDED."releaseDatePrecision",
      "releaseDateCheckedAt" = EXCLUDED."releaseDateCheckedAt",
      "releaseDateMovedFrom" = NULL, "releaseDateMovedAt" = NULL,
      "updatedAt" = now();
  END LOOP;

  DELETE FROM "Playthrough" WHERE "libraryItemId" IN (
    SELECT li.id FROM "LibraryItem" li JOIN "Game" g ON g.id = li."gameId"
    WHERE li."userId" = full_id AND g."igdbId" BETWEEN 900029001 AND 900029016);
  INSERT INTO "Playthrough" (id, "libraryItemId", ordinal, kind, status, platform, "startedAt", "playtimeMinutes", "updatedAt")
  SELECT gen_random_uuid()::text, li.id, 1, 'FIRST', 'PLAYING', li.platform, li."startedAt", 0, now()
  FROM "LibraryItem" li JOIN "Game" g ON g.id = li."gameId"
  WHERE li."userId" = full_id AND g."igdbId" BETWEEN 900029001 AND 900029016 AND li.status = 'PLAYING';
END $$;
