/*
  Warnings:

  - A unique constraint covering the columns `[userId,storefrontGameId]` on the table `ImportedGame` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ImportedGame_userId_storefrontGameId_key" ON "ImportedGame"("userId", "storefrontGameId");
