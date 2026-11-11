-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "coverChroma" DOUBLE PRECISION,
ADD COLUMN     "coverHue" INTEGER,
ADD COLUMN     "coverTintComputedAt" TIMESTAMP(3),
ADD COLUMN     "timeToCompleteSeconds" INTEGER,
ADD COLUMN     "timeToCreditsSeconds" INTEGER,
ADD COLUMN     "timesToBeatFetchedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "eveningMinutes" INTEGER NOT NULL DEFAULT 105;

-- Prisma cannot express CHECK constraints; unmanaged by schema.prisma.
ALTER TABLE "Game" ADD CONSTRAINT "Game_coverHue_range_check" CHECK ("coverHue" BETWEEN 0 AND 359);
ALTER TABLE "Game" ADD CONSTRAINT "Game_coverChroma_nonnegative_check" CHECK ("coverChroma" >= 0);
ALTER TABLE "user" ADD CONSTRAINT "user_eveningMinutes_range_check" CHECK ("eveningMinutes" BETWEEN 30 AND 360);
