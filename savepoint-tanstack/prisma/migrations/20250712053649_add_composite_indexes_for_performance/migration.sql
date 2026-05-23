-- CreateIndex
CREATE INDEX "BacklogItem_userId_status_idx" ON "BacklogItem"("userId", "status");

-- CreateIndex
CREATE INDEX "BacklogItem_userId_platform_idx" ON "BacklogItem"("userId", "platform");

-- CreateIndex
CREATE INDEX "BacklogItem_userId_createdAt_idx" ON "BacklogItem"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BacklogItem_gameId_idx" ON "BacklogItem"("gameId");

-- CreateIndex
CREATE INDEX "ImportedGame_userId_deletedAt_idx" ON "ImportedGame"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "ImportedGame_storefrontGameId_idx" ON "ImportedGame"("storefrontGameId");
