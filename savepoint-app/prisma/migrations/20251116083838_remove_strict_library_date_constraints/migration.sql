-- Remove overly strict date constraints that prevent backdating game start/completion dates
--
-- Users should be able to add games to their library and specify when they started/completed them,
-- even if those dates are in the past. The only constraint that should remain is ensuring
-- completedAt is not before startedAt.

-- Drop constraint requiring startedAt to be >= createdAt
ALTER TABLE "LibraryItem" DROP CONSTRAINT IF EXISTS "startedAt_after_createdAt";

-- Drop constraint requiring completedAt to be >= createdAt
ALTER TABLE "LibraryItem" DROP CONSTRAINT IF EXISTS "completedAt_after_createdAt";

-- Keep the completedAt_after_startedAt constraint (it's still valid)
-- Users cannot complete a game before they started it
