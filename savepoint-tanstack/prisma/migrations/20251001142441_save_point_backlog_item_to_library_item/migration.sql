/*
  Warnings:

  - The `status` column on the `BacklogItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "LibraryItemStatus" AS ENUM ('CURIOUS_ABOUT', 'CURRENTLY_EXPLORING', 'TOOK_A_BREAK', 'EXPERIENCED', 'WISHLIST', 'REVISITING');

-- AlterTable
ALTER TABLE "BacklogItem" DROP COLUMN "status",
ADD COLUMN     "status" "LibraryItemStatus" NOT NULL DEFAULT 'CURIOUS_ABOUT';

-- DropEnum
DROP TYPE "BacklogItemStatus";

-- CreateIndex
CREATE INDEX "BacklogItem_userId_status_idx" ON "BacklogItem"("userId", "status");
