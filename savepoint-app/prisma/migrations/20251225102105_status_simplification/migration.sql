-- Status Simplification Migration
-- Converts 6 statuses to 4 statuses using column recreation approach
-- This avoids PostgreSQL's "unsafe use of new value" error with ALTER TYPE ADD VALUE

-- Step 1: Create the new enum type with only the 4 new values
CREATE TYPE "LibraryItemStatus_new" AS ENUM ('WANT_TO_PLAY', 'OWNED', 'PLAYING', 'PLAYED');

-- Step 2: Add a temporary column with the new enum type
ALTER TABLE "LibraryItem" ADD COLUMN "status_new" "LibraryItemStatus_new";

-- Step 3: Migrate data from old column to new column with mapping
UPDATE "LibraryItem" SET "status_new" =
  CASE
    WHEN status::text IN ('WISHLIST', 'CURIOUS_ABOUT') THEN 'WANT_TO_PLAY'::"LibraryItemStatus_new"
    WHEN status::text IN ('CURRENTLY_EXPLORING', 'REVISITING') THEN 'PLAYING'::"LibraryItemStatus_new"
    WHEN status::text IN ('TOOK_A_BREAK', 'EXPERIENCED') THEN 'PLAYED'::"LibraryItemStatus_new"
    ELSE 'PLAYED'::"LibraryItemStatus_new"
  END;

-- Step 4: Drop the old column
ALTER TABLE "LibraryItem" DROP COLUMN "status";

-- Step 5: Rename new column to original name
ALTER TABLE "LibraryItem" RENAME COLUMN "status_new" TO "status";

-- Step 6: Set NOT NULL constraint and default
ALTER TABLE "LibraryItem" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "LibraryItem" ALTER COLUMN "status" SET DEFAULT 'PLAYED'::"LibraryItemStatus_new";

-- Step 7: Drop old enum type and rename new one
DROP TYPE "LibraryItemStatus";
ALTER TYPE "LibraryItemStatus_new" RENAME TO "LibraryItemStatus";
