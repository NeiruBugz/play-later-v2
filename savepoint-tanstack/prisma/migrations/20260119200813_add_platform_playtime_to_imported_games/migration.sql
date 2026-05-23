-- AlterTable
ALTER TABLE "ImportedGame" ADD COLUMN     "lastPlayedAt" TIMESTAMP(3),
ADD COLUMN     "playtimeLinux" INTEGER DEFAULT 0,
ADD COLUMN     "playtimeMac" INTEGER DEFAULT 0,
ADD COLUMN     "playtimeWindows" INTEGER DEFAULT 0;
