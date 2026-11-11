-- Spec 028 review fixtures for audit_full. LOCAL DB ONLY. Apply after the 026 seed (capture's --reseed does this).
-- Run: docker exec -i savepoint-postgres psql -v ON_ERROR_STOP=1 -U postgres -d savepoint-db < review-fixtures.sql
-- Idempotent: fixture notes carry the tag 'review-fixture' and are replaced on every run.
--
-- Cover ids were checked by downloading t_thumb and averaging a 16x16 resample:
--   co2y6s  Final Fantasy II  mean RGB 227,23,35   (mostly red)
--   co20n4  Black Mesa        mean RGB 132,144,67  (green: 24% of pixels clearly green; the greenest cover available locally)
--   coctc7  Greyscale Cover   Metal Gear: Ghost Babel cover; 99.7% of pixels achromatic (OKLCH chroma < 0.04 or max channel gap <= 12), luminance sd 97
--   none    Review Fixture: No Cover

DO $$
DECLARE
  full_id text := (SELECT id FROM "user" WHERE email = 'audit_full@savepoint.local');
  row     record;
BEGIN
  IF full_id IS NULL THEN
    RAISE EXCEPTION 'audit_full missing: sign it up and run the 026 seed first';
  END IF;

  DELETE FROM "JournalEntry" WHERE "userId" = full_id AND tags @> ARRAY['review-fixture'];

  -- Retired fixture (Garagem SA, igdbId 345628): remove it and its rows so it does not linger
  DELETE FROM "JournalEntry" WHERE "gameId" IN (SELECT id FROM "Game" WHERE "igdbId" = 345628);
  DELETE FROM "Playthrough" WHERE "libraryItemId" IN (
    SELECT li.id FROM "LibraryItem" li JOIN "Game" g ON g.id = li."gameId" WHERE g."igdbId" = 345628);
  DELETE FROM "LibraryItem" WHERE "gameId" IN (SELECT id FROM "Game" WHERE "igdbId" = 345628);
  DELETE FROM "Game" WHERE "igdbId" = 345628;

  INSERT INTO "Game" (id, "igdbId", title, slug, "coverImage", "updatedAt")
  VALUES
    ('review-fixture-red',      387,       'Final Fantasy II',        'final-fantasy-ii',        'https://images.igdb.com/igdb/image/upload/t_cover_big/co2y6s.jpg', now()),
    ('review-fixture-green',    6739,      'Black Mesa',              'black-mesa',              'https://images.igdb.com/igdb/image/upload/t_cover_big/co20n4.jpg', now()),
    ('review-fixture-bw',       900000002, 'Review Fixture: Greyscale Cover', 'review-fixture-greyscale-cover', 'https://images.igdb.com/igdb/image/upload/t_cover_big/coctc7.jpg', now()),
    ('review-fixture-no-cover', 900000001, 'Review Fixture: No Cover', 'review-fixture-no-cover', NULL, now())
  ON CONFLICT ("igdbId") DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, "coverImage" = EXCLUDED."coverImage", "updatedAt" = now();

  -- Playing library items for the four fixture games
  FOR row IN SELECT * FROM (VALUES
    (387::int,       30),
    (6739::int,      45),
    (900000002::int, 90),
    (900000001::int, 10)
  ) AS t(igdb, started_days_ago)
  LOOP
    INSERT INTO "LibraryItem" ("userId", "gameId", status, platform, "hasBeenPlayed", "isOwned", "upNextPosition",
                               "startedAt", "completedAt", "doneOutcome", "createdAt", "updatedAt", "statusChangedAt")
    SELECT full_id, g.id, 'PLAYING', 'PC', true, true, NULL,
           now() - make_interval(days => row.started_days_ago), NULL, NULL,
           now() - make_interval(days => row.started_days_ago + 5), now(), now() - make_interval(days => row.started_days_ago)
    FROM "Game" g WHERE g."igdbId" = row.igdb
    ON CONFLICT ("userId", "gameId") DO UPDATE SET
      status = 'PLAYING', "upNextPosition" = NULL, "completedAt" = NULL, "doneOutcome" = NULL,
      "hasBeenPlayed" = true, "startedAt" = EXCLUDED."startedAt", "statusChangedAt" = EXCLUDED."statusChangedAt",
      "updatedAt" = now();
  END LOOP;

  -- One open play per fixture game (replaces any earlier fixture play)
  DELETE FROM "Playthrough" WHERE "libraryItemId" IN (
    SELECT li.id FROM "LibraryItem" li JOIN "Game" g ON g.id = li."gameId"
    WHERE li."userId" = full_id AND g."igdbId" IN (387, 6739, 900000002, 900000001));
  INSERT INTO "Playthrough" (id, "libraryItemId", ordinal, kind, status, platform, "startedAt", "playtimeMinutes", "updatedAt")
  SELECT gen_random_uuid()::text, li.id, 1, 'FIRST', 'PLAYING', li.platform, li."startedAt", 0, now()
  FROM "LibraryItem" li JOIN "Game" g ON g.id = li."gameId"
  WHERE li."userId" = full_id AND g."igdbId" IN (387, 6739, 900000002, 900000001);

  -- Dated sessions: Final Fantasy II has three (last 3 days ago), Black Mesa last 14 days ago, the greyscale fixture last 40 days ago
  FOR row IN SELECT * FROM (VALUES
    (387::int,    3,  90,  'Reached the Mysidia chapter.'),
    (387::int,    6,  120, 'Leveled spells until they stopped failing.'),
    (387::int,    10, 75,  'Fixed the party after the Fynn siege.'),
    (6739::int,   14, 60,  'Surface Tension, slowly.'),
    (6739::int,   20, 45,  'Back to the lambda core.'),
    (900000002::int, 40, 30,  'One lap of the first track.')
  ) AS t(igdb, days_ago, minutes, content)
  LOOP
    INSERT INTO "JournalEntry" (id, kind, content, "playedMinutes", tags, "userId", "gameId", "libraryItemId", "playthroughId",
                                "createdAt", "updatedAt")
    SELECT gen_random_uuid()::text, 'QUICK', row.content, row.minutes, ARRAY['review-fixture'], full_id, g.id, li.id, p.id,
           now() - make_interval(days => row.days_ago), now() - make_interval(days => row.days_ago)
    FROM "Game" g
    JOIN "LibraryItem" li ON li."gameId" = g.id AND li."userId" = full_id
    JOIN "Playthrough" p ON p."libraryItemId" = li.id AND p.ordinal = 1
    WHERE g."igdbId" = row.igdb;
  END LOOP;

  -- game-done with a Let go reason: Crisis Core is already Done / LET_GO in the 026 seed; give it the reason note
  INSERT INTO "JournalEntry" (id, kind, content, prompt, tags, "userId", "gameId", "libraryItemId", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, 'QUICK', 'The missions are too repetitive for me right now.', 'STAYED', ARRAY['review-fixture'],
         full_id, li."gameId", li.id, now() - interval '150 days', now() - interval '150 days'
  FROM "LibraryItem" li JOIN "Game" g ON g.id = li."gameId"
  WHERE li."userId" = full_id AND g.title = 'Crisis Core: Final Fantasy VII' AND li."doneOutcome" = 'LET_GO';
END $$;
