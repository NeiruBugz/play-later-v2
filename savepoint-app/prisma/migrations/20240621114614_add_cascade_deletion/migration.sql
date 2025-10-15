-- DropForeignKey
ALTER TABLE "BacklogItem" DROP CONSTRAINT "BacklogItem_gameId_fkey";

-- AddForeignKey
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
