-- DropForeignKey
ALTER TABLE "Playthrough" DROP CONSTRAINT "Playthrough_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Playthrough" DROP CONSTRAINT "Playthrough_userId_fkey";

-- AddForeignKey
ALTER TABLE "Playthrough" ADD CONSTRAINT "Playthrough_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playthrough" ADD CONSTRAINT "Playthrough_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
