/*
  Warnings:

  - You are about to drop the `BacklogItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BacklogItem" DROP CONSTRAINT "BacklogItem_gameId_fkey";

-- DropForeignKey
ALTER TABLE "BacklogItem" DROP CONSTRAINT "BacklogItem_userId_fkey";

-- DropForeignKey
ALTER TABLE "JournalEntry" DROP CONSTRAINT "JournalEntry_libraryItemId_fkey";

-- DropTable
DROP TABLE "BacklogItem";

-- CreateTable
CREATE TABLE "LibraryItem" (
    "id" SERIAL NOT NULL,
    "status" "LibraryItemStatus" NOT NULL DEFAULT 'CURIOUS_ABOUT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "platform" TEXT,
    "userId" TEXT NOT NULL,
    "acquisitionType" "AcquisitionType" NOT NULL DEFAULT 'DIGITAL',
    "gameId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LibraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LibraryItem_userId_status_idx" ON "LibraryItem"("userId", "status");

-- CreateIndex
CREATE INDEX "LibraryItem_userId_platform_idx" ON "LibraryItem"("userId", "platform");

-- CreateIndex
CREATE INDEX "LibraryItem_userId_createdAt_idx" ON "LibraryItem"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LibraryItem_gameId_idx" ON "LibraryItem"("gameId");

-- AddForeignKey
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_libraryItemId_fkey" FOREIGN KEY ("libraryItemId") REFERENCES "LibraryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
