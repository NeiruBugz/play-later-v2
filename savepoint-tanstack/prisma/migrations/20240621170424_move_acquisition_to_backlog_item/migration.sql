/*
  Warnings:

  - You are about to drop the column `acquisitionType` on the `Game` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BacklogItem" ADD COLUMN     "acquisitionType" "AcquisitionType" NOT NULL DEFAULT 'DIGITAL';

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "acquisitionType";
