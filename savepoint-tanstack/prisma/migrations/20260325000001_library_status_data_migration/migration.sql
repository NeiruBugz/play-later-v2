-- Step 1: Migrate data from old values to new values
UPDATE "LibraryItem" SET "status" = 'WISHLIST' WHERE "status" = 'WANT_TO_PLAY';
UPDATE "LibraryItem" SET "status" = 'SHELF' WHERE "status" = 'OWNED';

-- Step 2: Add hasBeenPlayed column
ALTER TABLE "LibraryItem" ADD COLUMN "hasBeenPlayed" BOOLEAN NOT NULL DEFAULT false;

-- Step 3: Backfill hasBeenPlayed for items that are already PLAYED
UPDATE "LibraryItem" SET "hasBeenPlayed" = true WHERE "status" = 'PLAYED';

-- Step 4: Update default to SHELF
ALTER TABLE "LibraryItem" ALTER COLUMN "status" SET DEFAULT 'SHELF';

-- Step 5: Remove old enum values (rename old, create new, migrate, drop old)
ALTER TYPE "LibraryItemStatus" RENAME TO "LibraryItemStatus_old";

CREATE TYPE "LibraryItemStatus" AS ENUM ('WISHLIST', 'SHELF', 'UP_NEXT', 'PLAYING', 'PLAYED');

ALTER TABLE "LibraryItem"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "LibraryItemStatus" USING ("status"::text::"LibraryItemStatus"),
  ALTER COLUMN "status" SET DEFAULT 'SHELF';

DROP TYPE "LibraryItemStatus_old";
