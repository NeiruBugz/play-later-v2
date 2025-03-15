-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "SteamImportJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "steamId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "processedGames" INTEGER NOT NULL DEFAULT 0,
    "importedGames" INTEGER NOT NULL DEFAULT 0,
    "skippedGames" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SteamImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SteamImportJob_userId_idx" ON "SteamImportJob"("userId");

-- CreateIndex
CREATE INDEX "SteamImportJob_status_idx" ON "SteamImportJob"("status");

-- AddForeignKey
ALTER TABLE "SteamImportJob" ADD CONSTRAINT "SteamImportJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
