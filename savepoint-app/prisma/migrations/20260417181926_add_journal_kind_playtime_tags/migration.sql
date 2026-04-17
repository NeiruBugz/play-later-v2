-- CreateEnum
CREATE TYPE "JournalEntryKind" AS ENUM ('QUICK', 'REFLECTION');

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "kind" "JournalEntryKind" NOT NULL DEFAULT 'QUICK',
ADD COLUMN     "playedMinutes" INTEGER,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "gameId" DROP NOT NULL;

-- Backfill: existing entries with non-empty content are long-form reflections.
UPDATE "JournalEntry" SET "kind" = 'REFLECTION' WHERE length("content") > 0;
