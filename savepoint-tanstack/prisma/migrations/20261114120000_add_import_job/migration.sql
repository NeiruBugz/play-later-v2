-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('QUEUED', 'GATHERING', 'LOOKING_UP', 'FINISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportFailureCode" AS ENUM ('PROFILE_PRIVATE', 'STEAM_UNAVAILABLE', 'RATE_LIMITED', 'STALLED', 'START_FAILED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storefront" "Storefront" NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'QUEUED',
    "addAllToLibrary" BOOLEAN NOT NULL DEFAULT false,
    "storefrontAccountId" TEXT NOT NULL,
    "totalToLookUp" INTEGER NOT NULL DEFAULT 0,
    "lookedUp" INTEGER NOT NULL DEFAULT 0,
    "totalChunks" INTEGER NOT NULL DEFAULT 0,
    "doneChunkIndexes" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "newGames" INTEGER NOT NULL DEFAULT 0,
    "refreshedGames" INTEGER NOT NULL DEFAULT 0,
    "addedToLibrary" INTEGER NOT NULL DEFAULT 0,
    "needsMatch" INTEGER NOT NULL DEFAULT 0,
    "failureCode" "ImportFailureCode",
    "noticeSeenAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportJob_userId_storefront_createdAt_idx" ON "ImportJob"("userId", "storefront", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- At most one active sync per user per storefront. Prisma cannot express partial
-- indexes; this index is unmanaged by schema.prisma (see FOOT-GUNS.md). The
-- start-sync query inserts with ON CONFLICT DO NOTHING against it.
CREATE UNIQUE INDEX "ImportJob_active_userId_storefront_key"
ON "ImportJob" ("userId", "storefront")
WHERE "status" IN ('QUEUED', 'GATHERING', 'LOOKING_UP');

-- Counters never go negative.
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_counters_non_negative_check"
CHECK (
  "totalToLookUp" >= 0
  AND "lookedUp" >= 0
  AND "totalChunks" >= 0
  AND "newGames" >= 0
  AND "refreshedGames" >= 0
  AND "addedToLibrary" >= 0
  AND "needsMatch" >= 0
);

-- More chunks cannot be marked done than the job has.
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_done_chunks_within_total_check"
CHECK (cardinality("doneChunkIndexes") <= "totalChunks");

-- A job is terminal exactly when it has a finish time.
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_terminal_iff_finished_check"
CHECK (("status" IN ('FINISHED', 'FAILED')) = ("finishedAt" IS NOT NULL));
