-- CreateEnum
CREATE TYPE "PlaythroughKind" AS ENUM ('FIRST', 'REPLAY');

-- CreateEnum
CREATE TYPE "PlaythroughStatus" AS ENUM ('PLAYING', 'FINISHED', 'ABANDONED');

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "playthroughId" TEXT;

-- AlterTable
ALTER TABLE "LibraryItem" ADD COLUMN     "statusIsManual" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Playthrough" (
    "id" TEXT NOT NULL,
    "libraryItemId" INTEGER NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "kind" "PlaythroughKind" NOT NULL DEFAULT 'REPLAY',
    "status" "PlaythroughStatus" NOT NULL DEFAULT 'PLAYING',
    "platform" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "playtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "rating" INTEGER,
    "completion" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playthrough_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Playthrough_libraryItemId_idx" ON "Playthrough"("libraryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Playthrough_libraryItemId_ordinal_key" ON "Playthrough"("libraryItemId", "ordinal");

-- CreateIndex
CREATE INDEX "JournalEntry_playthroughId_idx" ON "JournalEntry"("playthroughId");

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_playthroughId_fkey" FOREIGN KEY ("playthroughId") REFERENCES "Playthrough"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playthrough" ADD CONSTRAINT "Playthrough_libraryItemId_fkey" FOREIGN KEY ("libraryItemId") REFERENCES "LibraryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data backfill: create one Playthrough per played LibraryItem (PLAYING or PLAYED status).
-- Idempotent: skips items that already have a Playthrough row.
INSERT INTO "Playthrough" (
  "id",
  "libraryItemId",
  "ordinal",
  "kind",
  "status",
  "platform",
  "startedAt",
  "finishedAt",
  "playtimeMinutes",
  "rating",
  "createdAt",
  "updatedAt"
)
SELECT
  'backfill-' || li.id::text || '-' || md5(random()::text),
  li.id,
  1,
  'FIRST'::"PlaythroughKind",
  CASE li.status
    WHEN 'PLAYED'   THEN 'FINISHED'::"PlaythroughStatus"
    WHEN 'PLAYING'  THEN 'PLAYING'::"PlaythroughStatus"
  END,
  li.platform,
  li."startedAt",
  li."completedAt",
  COALESCE((
    SELECT SUM(je."playedMinutes")
    FROM "JournalEntry" je
    WHERE je."libraryItemId" = li.id
  ), 0),
  li.rating,
  NOW(),
  NOW()
FROM "LibraryItem" li
WHERE li.status IN ('PLAYING', 'PLAYED')
  AND NOT EXISTS (
    SELECT 1 FROM "Playthrough" p WHERE p."libraryItemId" = li.id
  );

-- Re-point journal entries to the newly created Playthrough rows.
-- Idempotent: only updates entries whose playthroughId is still NULL.
UPDATE "JournalEntry" je
SET "playthroughId" = p.id
FROM "Playthrough" p
WHERE p."libraryItemId" = je."libraryItemId"
  AND je."playthroughId" IS NULL
  AND je."libraryItemId" IS NOT NULL;
