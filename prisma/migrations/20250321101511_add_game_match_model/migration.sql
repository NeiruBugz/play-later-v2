-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'CORRECTED', 'NEEDS_REVIEW', 'IGNORED');

-- CreateTable
CREATE TABLE "GameMatch" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "steamAppId" INTEGER NOT NULL,
    "steamTitle" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "notes" TEXT,

    CONSTRAINT "GameMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameMatch_steamAppId_idx" ON "GameMatch"("steamAppId");

-- CreateIndex
CREATE INDEX "GameMatch_gameId_idx" ON "GameMatch"("gameId");

-- CreateIndex
CREATE INDEX "GameMatch_verifiedBy_idx" ON "GameMatch"("verifiedBy");

-- CreateIndex
CREATE INDEX "GameMatch_status_idx" ON "GameMatch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GameMatch_gameId_steamAppId_key" ON "GameMatch"("gameId", "steamAppId");

-- AddForeignKey
ALTER TABLE "GameMatch" ADD CONSTRAINT "GameMatch_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameMatch" ADD CONSTRAINT "GameMatch_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
