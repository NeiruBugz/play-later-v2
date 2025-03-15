-- AlterTable
ALTER TABLE "SteamImportJob" ADD COLUMN     "failedGames" INTEGER DEFAULT 0,
ALTER COLUMN "importedGames" DROP NOT NULL,
ALTER COLUMN "importedGames" DROP DEFAULT,
ALTER COLUMN "skippedGames" DROP NOT NULL,
ALTER COLUMN "skippedGames" DROP DEFAULT;

-- CreateTable
CREATE TABLE "FailedImport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "steamImportJobId" TEXT,
    "steamAppId" INTEGER NOT NULL,
    "gameName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "errorMessage" TEXT,
    "playtime" INTEGER NOT NULL DEFAULT 0,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailedImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FailedImport_userId_idx" ON "FailedImport"("userId");

-- CreateIndex
CREATE INDEX "FailedImport_steamImportJobId_idx" ON "FailedImport"("steamImportJobId");

-- CreateIndex
CREATE INDEX "FailedImport_steamAppId_idx" ON "FailedImport"("steamAppId");

-- AddForeignKey
ALTER TABLE "FailedImport" ADD CONSTRAINT "FailedImport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FailedImport" ADD CONSTRAINT "FailedImport_steamImportJobId_fkey" FOREIGN KEY ("steamImportJobId") REFERENCES "SteamImportJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
