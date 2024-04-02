/*
  Warnings:

  - The `platform` column on the `Game` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
ALTER TYPE "GameStatus" ADD VALUE 'SHELVED';

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "platform",
ADD COLUMN     "platform" TEXT;
