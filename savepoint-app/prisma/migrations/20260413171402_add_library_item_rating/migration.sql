-- AlterTable
ALTER TABLE "LibraryItem" ADD COLUMN     "rating" INTEGER;

-- CreateIndex
CREATE INDEX "LibraryItem_userId_rating_idx" ON "LibraryItem"("userId", "rating");

-- AddCheckConstraint
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_rating_check" CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 10);
