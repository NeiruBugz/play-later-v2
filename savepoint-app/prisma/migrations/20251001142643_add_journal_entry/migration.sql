-- CreateEnum
CREATE TYPE "JournalMood" AS ENUM ('EXCITED', 'RELAXED', 'FRUSTRATED', 'ACCOMPLISHED', 'CURIOUS', 'NOSTALGIC');

-- CreateEnum
CREATE TYPE "JournalVisibility" AS ENUM ('PRIVATE', 'FRIENDS_ONLY', 'PUBLIC');

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "mood" "JournalMood",
    "playSession" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "JournalVisibility" NOT NULL DEFAULT 'PRIVATE',
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "libraryItemId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JournalEntry_userId_createdAt_idx" ON "JournalEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "JournalEntry_gameId_idx" ON "JournalEntry"("gameId");

-- CreateIndex
CREATE INDEX "JournalEntry_libraryItemId_idx" ON "JournalEntry"("libraryItemId");

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_libraryItemId_fkey" FOREIGN KEY ("libraryItemId") REFERENCES "BacklogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
