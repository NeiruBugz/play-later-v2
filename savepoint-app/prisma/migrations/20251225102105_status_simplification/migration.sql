-- Step 1: Add new enum values
ALTER TYPE "LibraryItemStatus" ADD VALUE IF NOT EXISTS 'WANT_TO_PLAY';
ALTER TYPE "LibraryItemStatus" ADD VALUE IF NOT EXISTS 'OWNED';
ALTER TYPE "LibraryItemStatus" ADD VALUE IF NOT EXISTS 'PLAYING';
ALTER TYPE "LibraryItemStatus" ADD VALUE IF NOT EXISTS 'PLAYED';

-- Step 2: Migrate existing data
UPDATE "LibraryItem" SET status = 'WANT_TO_PLAY' WHERE status IN ('WISHLIST', 'CURIOUS_ABOUT');
UPDATE "LibraryItem" SET status = 'PLAYING' WHERE status IN ('CURRENTLY_EXPLORING', 'REVISITING');
UPDATE "LibraryItem" SET status = 'PLAYED' WHERE status IN ('TOOK_A_BREAK', 'EXPERIENCED');

-- Step 3: Update default
ALTER TABLE "LibraryItem" ALTER COLUMN status SET DEFAULT 'PLAYED';

-- Note: Old enum values remain in PostgreSQL (cannot be removed without column recreation)
-- They become "dead" values that cannot be set via application code
