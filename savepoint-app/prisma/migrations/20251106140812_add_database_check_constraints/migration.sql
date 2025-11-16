-- Add check constraints for data integrity

-- LibraryItem constraints
-- Ensure startedAt is not before createdAt
ALTER TABLE "LibraryItem" ADD CONSTRAINT "startedAt_after_createdAt"
CHECK ("startedAt" IS NULL OR "startedAt" >= "createdAt");

-- Ensure completedAt is not before createdAt
ALTER TABLE "LibraryItem" ADD CONSTRAINT "completedAt_after_createdAt"
CHECK ("completedAt" IS NULL OR "completedAt" >= "createdAt");

-- Ensure completedAt is not before startedAt
ALTER TABLE "LibraryItem" ADD CONSTRAINT "completedAt_after_startedAt"
CHECK ("startedAt" IS NULL OR "completedAt" IS NULL OR "completedAt" >= "startedAt");

-- Review constraints
-- Ensure rating is between 0 and 10
ALTER TABLE "Review" ADD CONSTRAINT "rating_range"
CHECK ("rating" >= 0 AND "rating" <= 10);

-- JournalEntry constraints
-- Ensure playSession is positive when provided
ALTER TABLE "JournalEntry" ADD CONSTRAINT "playSession_positive"
CHECK ("playSession" IS NULL OR "playSession" > 0);

-- Ensure publishedAt is not before createdAt
ALTER TABLE "JournalEntry" ADD CONSTRAINT "publishedAt_after_createdAt"
CHECK ("publishedAt" IS NULL OR "publishedAt" >= "createdAt");
