-- AlterTable
ALTER TABLE "ImportedGame" ADD COLUMN     "gameId" TEXT,
ADD COLUMN     "lookedUpAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Game_steamAppId_idx" ON "Game"("steamAppId");

-- CreateIndex
CREATE INDEX "ImportedGame_gameId_idx" ON "ImportedGame"("gameId");

-- AddForeignKey
ALTER TABLE "ImportedGame" ADD CONSTRAINT "ImportedGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

