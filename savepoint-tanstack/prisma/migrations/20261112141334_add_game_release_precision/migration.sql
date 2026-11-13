-- CreateEnum
CREATE TYPE "ReleaseDatePrecision" AS ENUM ('DAY', 'MONTH', 'QUARTER', 'YEAR', 'TBA');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "releaseDateCheckedAt" TIMESTAMP(3),
ADD COLUMN     "releaseDateMovedAt" TIMESTAMP(3),
ADD COLUMN     "releaseDateMovedFrom" TIMESTAMP(3),
ADD COLUMN     "releaseDatePrecision" "ReleaseDatePrecision";

-- Prisma cannot express CHECK constraints; unmanaged by schema.prisma.
ALTER TABLE "Game" ADD CONSTRAINT "Game_releaseDateMoved_pair_check" CHECK (("releaseDateMovedFrom" IS NULL) = ("releaseDateMovedAt" IS NULL));
ALTER TABLE "Game" ADD CONSTRAINT "Game_releaseDate_tba_without_date_check" CHECK ("releaseDatePrecision" IS DISTINCT FROM 'TBA' OR "releaseDate" IS NULL);
ALTER TABLE "Game" ADD CONSTRAINT "Game_releaseDate_calendar_day_check" CHECK ("releaseDate" IS NULL OR "releaseDate" = date_trunc('day', "releaseDate"));
