/*
  Warnings:

  - You are about to drop the column `completionist` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `hltbId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `mainExtra` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `mainStory` on the `Game` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Game_hltbId_key";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "completionist",
DROP COLUMN "hltbId",
DROP COLUMN "mainExtra",
DROP COLUMN "mainStory";
