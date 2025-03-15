/*
  Warnings:

  - The primary key for the `BacklogItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `gameId` on the `Genre` table. All the data in the column will be lost.
  - The primary key for the `Review` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `rating` on the `Review` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - The primary key for the `Screenshot` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `image_id` on the `Screenshot` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,gameId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `imageId` to the `Screenshot` table without a default value. This is not possible if the table is not empty.
  - Made the column `gameId` on table `Screenshot` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BacklogItem" DROP CONSTRAINT "BacklogItem_userId_fkey";

-- DropForeignKey
ALTER TABLE "Genre" DROP CONSTRAINT "Genre_gameId_fkey";

-- DropForeignKey
ALTER TABLE "IgnoredImportedGames" DROP CONSTRAINT "IgnoredImportedGames_userId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- DropForeignKey
ALTER TABLE "Screenshot" DROP CONSTRAINT "Screenshot_gameId_fkey";

-- AlterTable
ALTER TABLE "BacklogItem" DROP CONSTRAINT "BacklogItem_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "BacklogItem_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "BacklogItem_id_seq";

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Genre" DROP COLUMN "gameId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "IgnoredImportedGames" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Review" DROP CONSTRAINT "Review_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "rating" SET DATA TYPE SMALLINT,
ADD CONSTRAINT "Review_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Review_id_seq";

-- AlterTable
ALTER TABLE "Screenshot" DROP CONSTRAINT "Screenshot_pkey",
DROP COLUMN "image_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "imageId" TEXT NOT NULL,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "gameId" SET NOT NULL,
ADD CONSTRAINT "Screenshot_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "GameGenre" (
    "gameId" TEXT NOT NULL,
    "genreId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameGenre_pkey" PRIMARY KEY ("gameId","genreId")
);

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameGenre_gameId_idx" ON "GameGenre"("gameId");

-- CreateIndex
CREATE INDEX "GameGenre_genreId_idx" ON "GameGenre"("genreId");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_name_key" ON "Platform"("name");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "BacklogItem_userId_idx" ON "BacklogItem"("userId");

-- CreateIndex
CREATE INDEX "BacklogItem_gameId_idx" ON "BacklogItem"("gameId");

-- CreateIndex
CREATE INDEX "BacklogItem_status_idx" ON "BacklogItem"("status");

-- CreateIndex
CREATE INDEX "IgnoredImportedGames_userId_idx" ON "IgnoredImportedGames"("userId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_gameId_idx" ON "Review"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_gameId_key" ON "Review"("userId", "gameId");

-- CreateIndex
CREATE INDEX "Screenshot_gameId_idx" ON "Screenshot"("gameId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- AddForeignKey
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IgnoredImportedGames" ADD CONSTRAINT "IgnoredImportedGames_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameGenre" ADD CONSTRAINT "GameGenre_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameGenre" ADD CONSTRAINT "GameGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Screenshot" ADD CONSTRAINT "Screenshot_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
