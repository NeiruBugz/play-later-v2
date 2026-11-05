-- Spec 026 migration A (expand): three-status model + Up Next queue + plays + time-only logs.
-- All-or-nothing. Steps 2-7 read the OLD status values; the enum swap is step 8.

-- Guard: the (userId, gameId) unique index in step 10 must not meet duplicates.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "LibraryItem" GROUP BY "userId", "gameId" HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate (userId, gameId) LibraryItem rows exist; resolve before migrating';
  END IF;
END $$;

-- Step 1: enums and columns
CREATE TYPE "DoneOutcome" AS ENUM ('FINISHED', 'LET_GO');
CREATE TYPE "JournalPrompt" AS ENUM ('WHY', 'STAYED');

ALTER TABLE "JournalEntry" ADD COLUMN     "prompt" "JournalPrompt";

ALTER TABLE "LibraryItem" ADD COLUMN     "doneOutcome" "DoneOutcome",
ADD COLUMN     "isOwned" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "stayedPromptDismissedAt" TIMESTAMP(3),
ADD COLUMN     "upNextPosition" INTEGER,
ADD COLUMN     "whyPromptDismissedAt" TIMESTAMP(3);

ALTER TABLE "user" ADD COLUMN     "statusModelNoticePending" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Up Next queue (most recently edited first, cap 5). Must precede any write that touches updatedAt.
UPDATE "LibraryItem" li
SET "upNextPosition" = ranked.pos
FROM (
  SELECT id, row_number() OVER (PARTITION BY "userId" ORDER BY "updatedAt" DESC, id DESC) AS pos
  FROM "LibraryItem"
  WHERE "status" = 'UP_NEXT'
) ranked
WHERE li.id = ranked.id;

UPDATE "LibraryItem" SET "upNextPosition" = NULL WHERE "upNextPosition" > 5;

-- Remember which Up Next items were played before (read by step 7, before step 6 rewrites runs).
CREATE TEMP TABLE "_mcm_up_next_played_before" ON COMMIT DROP AS
SELECT li.id
FROM "LibraryItem" li
WHERE li."status" = 'UP_NEXT'
  AND (
    li."hasBeenPlayed"
    OR EXISTS (SELECT 1 FROM "Playthrough" p WHERE p."libraryItemId" = li.id AND p."finishedAt" IS NOT NULL)
  );

-- Step 3: Wishlist -> not owned
UPDATE "LibraryItem" SET "isOwned" = false WHERE "status" = 'WISHLIST';

-- Step 4: Played with at least one run, all abandoned -> Let go
UPDATE "LibraryItem" li
SET "doneOutcome" = 'LET_GO'
WHERE li."status" = 'PLAYED'
  AND EXISTS (SELECT 1 FROM "Playthrough" p WHERE p."libraryItemId" = li.id)
  AND NOT EXISTS (
    SELECT 1 FROM "Playthrough" p WHERE p."libraryItemId" = li.id AND p."status" <> 'ABANDONED'
  );

-- Step 5: game rating falls back to the highest run rating
UPDATE "LibraryItem" li
SET "rating" = best.max_rating
FROM (
  SELECT "libraryItemId", max("rating") AS max_rating
  FROM "Playthrough"
  WHERE "rating" IS NOT NULL
  GROUP BY "libraryItemId"
) best
WHERE li.id = best."libraryItemId" AND li."rating" IS NULL;

-- Step 6: plays. Stored status is the truth.
-- 6a: non-PLAYING items close any open run.
UPDATE "Playthrough" p
SET "finishedAt" = COALESCE(p."finishedAt", p."updatedAt")
FROM "LibraryItem" li
WHERE li.id = p."libraryItemId" AND li."status" <> 'PLAYING' AND p."finishedAt" IS NULL;

-- 6b: PLAYING items with several open runs keep the latest open one.
UPDATE "Playthrough" p
SET "finishedAt" = p."updatedAt"
FROM "LibraryItem" li
WHERE li.id = p."libraryItemId"
  AND li."status" = 'PLAYING'
  AND p."finishedAt" IS NULL
  AND p."ordinal" < (
    SELECT max(o."ordinal") FROM "Playthrough" o
    WHERE o."libraryItemId" = li.id AND o."finishedAt" IS NULL
  );

-- 6c: run-less non-PLAYING items that carry dates get one ended play so the dates survive in History.
INSERT INTO "Playthrough" ("id", "libraryItemId", "ordinal", "kind", "status", "platform", "startedAt", "finishedAt", "createdAt", "updatedAt")
SELECT 'backfill-' || li.id::text || '-' || md5(random()::text), li.id, 1, 'FIRST', 'FINISHED', li."platform",
       li."startedAt", COALESCE(li."completedAt", li."updatedAt"), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "LibraryItem" li
WHERE li."status" <> 'PLAYING'
  AND (li."startedAt" IS NOT NULL OR li."completedAt" IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM "Playthrough" p WHERE p."libraryItemId" = li.id);

-- 6d: PLAYING items without an open run get one.
INSERT INTO "Playthrough" ("id", "libraryItemId", "ordinal", "kind", "status", "platform", "startedAt", "createdAt", "updatedAt")
SELECT 'backfill-' || li.id::text || '-' || md5(random()::text), li.id,
       COALESCE((SELECT max(p."ordinal") FROM "Playthrough" p WHERE p."libraryItemId" = li.id), 0) + 1,
       'REPLAY', 'PLAYING', li."platform", COALESCE(li."startedAt", li."updatedAt"), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "LibraryItem" li
WHERE li."status" = 'PLAYING'
  AND NOT EXISTS (SELECT 1 FROM "Playthrough" p WHERE p."libraryItemId" = li.id AND p."finishedAt" IS NULL);

-- 6e: time played moves to logs. One time-only note for each run's minutes not already covered by its notes.
INSERT INTO "JournalEntry" ("id", "content", "playedMinutes", "userId", "gameId", "libraryItemId", "playthroughId", "createdAt", "updatedAt")
SELECT 'backfill-' || md5(p.id || random()::text), '', p."playtimeMinutes" - COALESCE(n.noted, 0),
       li."userId", li."gameId", li.id, p.id,
       COALESCE(p."finishedAt", p."updatedAt"), COALESCE(p."finishedAt", p."updatedAt")
FROM "Playthrough" p
JOIN "LibraryItem" li ON li.id = p."libraryItemId"
LEFT JOIN (
  SELECT "playthroughId", sum("playedMinutes") AS noted
  FROM "JournalEntry"
  WHERE "playthroughId" IS NOT NULL
  GROUP BY "playthroughId"
) n ON n."playthroughId" = p.id
WHERE p."playtimeMinutes" > COALESCE(n.noted, 0);

-- Step 7: remap UP_NEXT inside the old enum (played before -> PLAYED, otherwise SHELF); queue column is already set.
UPDATE "LibraryItem" li
SET "status" = CASE
  WHEN EXISTS (SELECT 1 FROM "_mcm_up_next_played_before" pb WHERE pb.id = li.id) THEN 'PLAYED'::"LibraryItemStatus"
  ELSE 'SHELF'::"LibraryItemStatus"
END
WHERE li."status" = 'UP_NEXT';

-- Step 8: enum swap (precedent: 20260325000001_library_status_data_migration)
ALTER TYPE "LibraryItemStatus" RENAME TO "LibraryItemStatus_old";

CREATE TYPE "LibraryItemStatus" AS ENUM ('WANT', 'PLAYING', 'DONE');

ALTER TABLE "LibraryItem"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "LibraryItemStatus" USING (
    CASE "status"::text
      WHEN 'WISHLIST' THEN 'WANT'
      WHEN 'SHELF' THEN 'WANT'
      WHEN 'PLAYING' THEN 'PLAYING'
      WHEN 'PLAYED' THEN 'DONE'
    END::"LibraryItemStatus"
  ),
  ALTER COLUMN "status" SET DEFAULT 'WANT';

DROP TYPE "LibraryItemStatus_old";

-- Step 9: one-time explanation notice for every existing user
UPDATE "user" SET "statusModelNoticePending" = true;

-- Step 10: constraints and index verification
CREATE UNIQUE INDEX "LibraryItem_userId_gameId_key" ON "LibraryItem"("userId", "gameId");

CREATE UNIQUE INDEX "LibraryItem_userId_upNextPosition_key" ON "LibraryItem"("userId", "upNextPosition");

ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_upNextPosition_range_check" CHECK ("upNextPosition" BETWEEN 1 AND 5);

CREATE INDEX IF NOT EXISTS "LibraryItem_userId_status_idx" ON "LibraryItem"("userId", "status");
