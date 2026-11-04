-- Seeds the local audit accounts with a pre-026 (five-status) library.
-- Accounts must exist first (created via Better Auth sign-up, see ui-audit.md § Setup).
-- Idempotent: wipes and re-creates the data of audit_full + audit_friend on every run.
-- Run: docker exec -i savepoint-postgres psql -U postgres -d savepoint-db < seed-audit-users.sql

DO $$
DECLARE
  full_id   text := (SELECT id FROM "user" WHERE email = 'audit_full@savepoint.local');
  friend_id text := (SELECT id FROM "user" WHERE email = 'audit_friend@savepoint.local');
  item_id   int;
  run_id    text;
  row       record;
BEGIN
  IF full_id IS NULL OR friend_id IS NULL THEN
    RAISE EXCEPTION 'audit accounts missing: sign them up first';
  END IF;

  DELETE FROM "JournalEntry" WHERE "userId" IN (full_id, friend_id);
  DELETE FROM "LibraryItem"  WHERE "userId" IN (full_id, friend_id);
  DELETE FROM "ImportedGame" WHERE "userId" IN (full_id, friend_id);
  DELETE FROM "Follow" WHERE "followerId" IN (full_id, friend_id) OR "followingId" IN (full_id, friend_id);

  UPDATE "user" SET
    username = 'audit_full', "usernameNormalized" = 'audit_full', "isPublicProfile" = true,
    "profileSetupCompletedAt" = now() - interval '200 days', "createdAt" = now() - interval '200 days',
    "steamId64" = '76561190000000001', "steamUsername" = 'audit_full_steam',
    "steamProfileURL" = 'https://steamcommunity.com/profiles/76561190000000001',
    "steamConnectedAt" = now() - interval '30 days', "updatedAt" = now()
  WHERE id = full_id;

  UPDATE "user" SET
    username = 'audit_friend', "usernameNormalized" = 'audit_friend', "isPublicProfile" = true,
    "profileSetupCompletedAt" = now() - interval '150 days', "createdAt" = now() - interval '150 days',
    "updatedAt" = now()
  WHERE id = friend_id;

  INSERT INTO "Follow" ("followerId", "followingId") VALUES (full_id, friend_id), (friend_id, full_id);

  -- audit_full library: every legacy status, the quirk cases from feature-brief §5
  FOR row IN SELECT * FROM (VALUES
    -- title, status, platform, acquisition, hasBeenPlayed, rating, statusIsManual, startedDaysAgo, completedDaysAgo, addedDaysAgo
    ('The Witcher 3: Wild Hunt',                       'PLAYING',  'PC',              'DIGITAL',      true,  9,    false, 20,   NULL, 700),
    ('Final Fantasy VII Rebirth',                      'PLAYING',  'PlayStation 5',   'PHYSICAL',     false, NULL, false, 10,   NULL, 60),
    ('Metal Gear Solid Delta: Snake Eater',            'PLAYING',  'PlayStation 5',   'DIGITAL',      false, NULL, false, 3,    NULL, 5),
    ('Final Fantasy VII Remake',                       'UP_NEXT',  'PlayStation 5',   'DIGITAL',      true,  8,    false, NULL, NULL, 400),
    ('Resident Evil 2',                                'UP_NEXT',  'PC',              'DIGITAL',      false, NULL, false, NULL, NULL, 90),
    ('Final Fantasy X HD Remaster',                    'UP_NEXT',  'PC',              'SUBSCRIPTION', false, NULL, false, NULL, NULL, 45),
    ('Assassin''s Creed Shadows',                      'UP_NEXT',  'PC',              'DIGITAL',      false, NULL, false, NULL, NULL, 20),
    ('Final Fantasy XV',                               'SHELF',    'PC',              'DIGITAL',      false, NULL, false, NULL, NULL, 300),
    ('Final Fantasy XIII',                             'SHELF',    'PC',              'DIGITAL',      false, NULL, false, NULL, NULL, 290),
    ('Crisis Core: Final Fantasy VII - Reunion',       'SHELF',    'Nintendo Switch', 'PHYSICAL',     false, NULL, false, NULL, NULL, 250),
    ('Resident Evil 6',                                'SHELF',    'PC',              'DIGITAL',      false, NULL, false, NULL, NULL, 240),
    ('Shadow Warrior',                                 'SHELF',    'PC',              'DIGITAL',      false, NULL, false, NULL, NULL, 230),
    ('Final Fantasy V',                                'SHELF',    'PC',              'DIGITAL',      false, NULL, false, NULL, NULL, 200),
    ('Final Fantasy III',                              'SHELF',    'PC',              'DIGITAL',      false, NULL, false, NULL, NULL, 199),
    ('Final Fantasy II',                               'SHELF',    'PC',              'DIGITAL',      false, NULL, false, NULL, NULL, 198),
    ('Dirge of Cerberus: Final Fantasy VII',           'SHELF',    'PlayStation 5',   'PHYSICAL',     false, NULL, false, NULL, NULL, 150),
    ('Final Fantasy VII Remake: Episode Intermission', 'SHELF',    'PlayStation 5',   'DIGITAL',      false, NULL, false, NULL, NULL, 120),
    ('Assassin''s Creed Shadows: Claws of Awaji',      'WISHLIST', NULL,              'DIGITAL',      false, NULL, false, NULL, NULL, 15),
    ('Resident Evil 4 VR',                             'WISHLIST', NULL,              'DIGITAL',      false, NULL, false, NULL, NULL, 40),
    ('Final Fantasy: Mystic Quest',                    'WISHLIST', NULL,              'DIGITAL',      false, NULL, false, NULL, NULL, 80),
    ('Scary Shadow Spot: Bitter Glass',                'WISHLIST', NULL,              'DIGITAL',      false, NULL, false, NULL, NULL, 8),
    ('Before Crisis: Final Fantasy VII',               'WISHLIST', NULL,              'DIGITAL',      false, NULL, false, NULL, NULL, 100),
    ('The Legend of Zelda: Breath of the Wild',        'PLAYED',   'Nintendo Switch', 'PHYSICAL',     true,  10,   false, 1100, 1000, 1100),
    ('Final Fantasy VII',                              'PLAYED',   'PC',              'DIGITAL',      true,  8,    false, 500,  470,  500),
    ('Crisis Core: Final Fantasy VII',                 'PLAYED',   'PC',              'DIGITAL',      true,  NULL, false, 180,  NULL, 180),
    ('Demon Hunter: Shadow World',                     'PLAYED',   'PC',              'DIGITAL',      true,  4,    true,  60,   NULL, 60),
    ('Final Fantasy VII Snowboarding',                 'PLAYED',   'PC',              'DIGITAL',      true,  NULL, false, NULL, 30,   35),
    ('Resident Evil 4: Mobile Edition',                'PLAYED',   'PC',              'DIGITAL',      true,  7,    false, 900,  50,   900)
  ) AS t(title, status, platform, acq, played, rating, manual, started, completed, added)
  LOOP
    INSERT INTO "LibraryItem" ("userId", "gameId", status, platform, "acquisitionType", "hasBeenPlayed", rating,
                               "statusIsManual", "startedAt", "completedAt", "createdAt", "updatedAt", "statusChangedAt")
    SELECT full_id, g.id, row.status::"LibraryItemStatus", row.platform, row.acq::"AcquisitionType", row.played, row.rating,
           row.manual, now() - make_interval(days => row.started), now() - make_interval(days => row.completed),
           now() - make_interval(days => row.added), now() - make_interval(days => least(row.added, coalesce(row.started, row.added))),
           now() - make_interval(days => least(row.added, coalesce(row.started, row.added)))
    FROM "Game" g WHERE g.title = row.title;
  END LOOP;

  -- Playthroughs (runs): replay in progress, abandoned-but-Played, two ratings, Replay-in-queue
  FOR row IN SELECT * FROM (VALUES
    -- title, ordinal, kind, status, startedDaysAgo, finishedDaysAgo, minutes, rating, completion
    ('The Witcher 3: Wild Hunt',                1, 'FIRST',  'FINISHED',  700,  640,  7200, 9,    'Main + DLC'),
    ('The Witcher 3: Wild Hunt',                2, 'REPLAY', 'PLAYING',   20,   NULL, 840,  NULL, NULL),
    ('Final Fantasy VII Rebirth',               1, 'FIRST',  'PLAYING',   10,   NULL, 1320, NULL, NULL),
    ('Final Fantasy VII Remake',                1, 'FIRST',  'FINISHED',  400,  370,  2400, 8,    'Main story'),
    ('The Legend of Zelda: Breath of the Wild', 1, 'FIRST',  'FINISHED',  1100, 1000, 8400, 10,   '100%'),
    ('Final Fantasy VII',                       1, 'FIRST',  'FINISHED',  500,  470,  2700, 8,    NULL),
    ('Crisis Core: Final Fantasy VII',          1, 'FIRST',  'ABANDONED', 180,  150,  420,  NULL, NULL),
    ('Demon Hunter: Shadow World',              1, 'FIRST',  'ABANDONED', 60,   55,   90,   NULL, NULL),
    ('Resident Evil 4: Mobile Edition',         1, 'FIRST',  'FINISHED',  900,  850,  600,  6,    NULL),
    ('Resident Evil 4: Mobile Edition',         2, 'REPLAY', 'FINISHED',  80,   50,   480,  8,    NULL)
  ) AS t(title, ordinal, kind, status, started, finished, minutes, rating, completion)
  LOOP
    INSERT INTO "Playthrough" (id, "libraryItemId", ordinal, kind, status, platform, "startedAt", "finishedAt",
                               "playtimeMinutes", rating, completion, "updatedAt")
    SELECT gen_random_uuid()::text, li.id, row.ordinal, row.kind::"PlaythroughKind", row.status::"PlaythroughStatus", li.platform,
           now() - make_interval(days => row.started), now() - make_interval(days => row.finished),
           row.minutes, row.rating, row.completion, now()
    FROM "LibraryItem" li JOIN "Game" g ON g.id = li."gameId"
    WHERE li."userId" = full_id AND g.title = row.title;
  END LOOP;

  -- Journal: quick notes + legacy reflections, with/without minutes, attached/unattached to runs, one without a game
  FOR row IN SELECT * FROM (VALUES
    -- title (NULL = no game), kind, daysAgo, minutes, attachToRunOrdinal, content
    ('The Witcher 3: Wild Hunt',                'QUICK',      1,   90,   2,    'Blood and Wine still hits. Toussaint at sunset.'),
    ('The Witcher 3: Wild Hunt',                'QUICK',      4,   120,  2,    'Skipped Gwent entirely this time, feels lighter.'),
    ('The Witcher 3: Wild Hunt',                'REFLECTION', 640,  NULL, 1,    'Finished the first run. The Bloody Baron questline is the best writing I have seen in an open world.'),
    ('Final Fantasy VII Rebirth',               'QUICK',      0,   150,  NULL, 'Junon area. Queen''s Blood is eating my evenings.'),
    ('Final Fantasy VII Rebirth',               'QUICK',      3,   60,   NULL, ''),
    ('Final Fantasy VII Rebirth',               'REFLECTION', 8,   NULL, NULL, 'The Grasslands opening made me stop and just look around for a while.'),
    ('Metal Gear Solid Delta: Snake Eater',     'QUICK',      2,   NULL, NULL, 'Controls take getting used to.'),
    ('The Legend of Zelda: Breath of the Wild', 'REFLECTION', 1000, NULL, 1,   'Done. No game has made me this curious about the next hill.'),
    ('Crisis Core: Final Fantasy VII',          'QUICK',      150, 30,   1,    'Letting this one go - the missions are too repetitive for me right now.'),
    ('Final Fantasy VII Remake',                'QUICK',      30,  NULL, NULL, 'Want to replay before Rebirth DLC.'),
    (NULL,                                      'QUICK',      12,  NULL, NULL, 'Thinking about only playing one big RPG at a time this year.')
  ) AS t(title, kind, days, minutes, run_ordinal, content)
  LOOP
    INSERT INTO "JournalEntry" (id, kind, content, "playedMinutes", "userId", "gameId", "libraryItemId", "playthroughId",
                                "createdAt", "updatedAt")
    SELECT gen_random_uuid()::text, row.kind::"JournalEntryKind", row.content, row.minutes, full_id, li."gameId", li.id, p.id,
           now() - make_interval(days => row.days), now() - make_interval(days => row.days)
    FROM (SELECT 1) one
    LEFT JOIN "Game" g ON g.title = row.title
    LEFT JOIN "LibraryItem" li ON li."gameId" = g.id AND li."userId" = full_id
    LEFT JOIN "Playthrough" p ON p."libraryItemId" = li.id AND p.ordinal = row.run_ordinal;
  END LOOP;

  -- audit_friend: small public library with recent status changes for the activity feed
  FOR row IN SELECT * FROM (VALUES
    ('The Witcher 3: Wild Hunt',                'PLAYING',  2),
    ('The Legend of Zelda: Breath of the Wild', 'PLAYED',   5),
    ('Resident Evil 2',                         'SHELF',    7),
    ('Final Fantasy XV',                        'UP_NEXT',  1),
    ('Final Fantasy VII Rebirth',               'WISHLIST', 3)
  ) AS t(title, status, days)
  LOOP
    INSERT INTO "LibraryItem" ("userId", "gameId", status, platform, "hasBeenPlayed", rating, "createdAt", "updatedAt", "statusChangedAt")
    SELECT friend_id, g.id, row.status::"LibraryItemStatus", 'PC', row.status = 'PLAYED',
           CASE WHEN row.status = 'PLAYED' THEN 9 END,
           now() - make_interval(days => row.days), now() - make_interval(days => row.days), now() - make_interval(days => row.days)
    FROM "Game" g WHERE g.title = row.title;
  END LOOP;

  -- Steam import staging for audit_full: copy the 40 most-played titles already staged locally
  INSERT INTO "ImportedGame" (id, name, storefront, "storefrontGameId", playtime, "lastPlayedAt", "igdbMatchStatus", "userId", "updatedAt")
  SELECT gen_random_uuid()::text, name, storefront, "storefrontGameId", playtime, "lastPlayedAt", 'PENDING', full_id, now()
  FROM (SELECT DISTINCT ON (name) * FROM "ImportedGame" WHERE "deletedAt" IS NULL AND "userId" NOT IN (full_id, friend_id)
        ORDER BY name, playtime DESC NULLS LAST) src
  ORDER BY playtime DESC NULLS LAST
  LIMIT 40;
END $$;

SELECT u.username, li.status, count(*) FROM "LibraryItem" li JOIN "user" u ON u.id = li."userId"
WHERE u.email LIKE 'audit_%' GROUP BY 1, 2 ORDER BY 1, 2;
