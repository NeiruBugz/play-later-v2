/*
  Warnings:

  - The `status` column on the `BacklogItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BacklogItemStatus" AS ENUM ('TO_PLAY', 'PLAYED', 'COMPLETED', 'WISHLIST');

-- AlterTable
ALTER TABLE "BacklogItem" DROP COLUMN "status",
ADD COLUMN     "status" "BacklogItemStatus" NOT NULL DEFAULT 'TO_PLAY';
