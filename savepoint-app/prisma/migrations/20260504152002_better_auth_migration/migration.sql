-- Better Auth Schema Migration
-- Renames auth tables from NextAuth shape to Better Auth shape.
-- Preserves all data in user and account tables.
-- Truncates session and verificationToken (short-lived tokens, forced re-sign-in at cutover).

-- =====================================================================
-- 1. ACCOUNT TABLE
-- Rename table and columns; convert expires_at (INTEGER epoch) to TIMESTAMP;
-- add new BA columns; drop old NextAuth-specific columns;
-- drop old compound unique, add new one.
-- =====================================================================

-- Step 1a: Rename columns that keep their data (simple renames)
ALTER TABLE "Account" RENAME COLUMN "provider" TO "providerId";
ALTER TABLE "Account" RENAME COLUMN "providerAccountId" TO "accountId";
ALTER TABLE "Account" RENAME COLUMN "refresh_token" TO "refreshToken";
ALTER TABLE "Account" RENAME COLUMN "access_token" TO "accessToken";
ALTER TABLE "Account" RENAME COLUMN "id_token" TO "idToken";

-- Step 1b: Drop old unique index on (provider, providerAccountId) — columns renamed above
DROP INDEX IF EXISTS "Account_provider_providerAccountId_key";

-- Step 1c: Convert expires_at (INTEGER epoch seconds) to accessTokenExpiresAt (TIMESTAMP)
-- Add new TIMESTAMP column
ALTER TABLE "Account" ADD COLUMN "accessTokenExpiresAt" TIMESTAMP(3);
-- Backfill from epoch integer
UPDATE "Account" SET "accessTokenExpiresAt" = (to_timestamp("expires_at") AT TIME ZONE 'UTC') WHERE "expires_at" IS NOT NULL;
-- Drop the old integer column
ALTER TABLE "Account" DROP COLUMN "expires_at";

-- Step 1d: Add new Better Auth columns
ALTER TABLE "Account" ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "Account" ADD COLUMN "password" TEXT;
ALTER TABLE "Account" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now();
ALTER TABLE "Account" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now();

-- Step 1e: Drop NextAuth-specific columns
ALTER TABLE "Account" DROP COLUMN IF EXISTS "type";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "token_type";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "session_state";

-- Step 1f: Rename table to lowercase
ALTER TABLE "Account" RENAME TO "account";

-- Step 1g: Add new unique constraint on (providerId, accountId)
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");


-- =====================================================================
-- 2. SESSION TABLE
-- Rename table and columns; add new BA columns; truncate existing rows
-- (every user must re-sign-in at cutover anyway).
-- =====================================================================

-- Truncate first while FK constraint still references old table name
TRUNCATE TABLE "Session";

-- Step 2a: Rename columns
ALTER TABLE "Session" RENAME COLUMN "sessionToken" TO "token";
ALTER TABLE "Session" RENAME COLUMN "expires" TO "expiresAt";

-- Step 2b: Drop old unique index on sessionToken (renamed to token)
DROP INDEX IF EXISTS "Session_sessionToken_key";

-- Step 2c: Add new BA columns
ALTER TABLE "Session" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "Session" ADD COLUMN "userAgent" TEXT;
ALTER TABLE "Session" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now();
ALTER TABLE "Session" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now();

-- Step 2d: Add new unique index on token
CREATE UNIQUE INDEX "session_token_key" ON "Session"("token");

-- Step 2e: Rename table to lowercase
ALTER TABLE "Session" RENAME TO "session";


-- =====================================================================
-- 3. VERIFICATIONTOKEN TABLE
-- Rename table and columns; truncate (tokens are short-lived).
-- =====================================================================

-- Truncate first (no FK constraints on this table)
TRUNCATE TABLE "VerificationToken";

-- Step 3a: Add id column (required by BA — use gen_random_uuid() or cuid-like text)
ALTER TABLE "VerificationToken" ADD COLUMN "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text;

-- Step 3b: Rename columns
ALTER TABLE "VerificationToken" RENAME COLUMN "token" TO "value";
ALTER TABLE "VerificationToken" RENAME COLUMN "expires" TO "expiresAt";

-- Step 3c: Drop old unique indexes
DROP INDEX IF EXISTS "VerificationToken_identifier_token_key";
DROP INDEX IF EXISTS "VerificationToken_token_key";

-- Step 3d: Add new BA columns
ALTER TABLE "VerificationToken" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now();
ALTER TABLE "VerificationToken" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now();

-- Step 3e: Add primary key on id and unique index on value
ALTER TABLE "VerificationToken" ADD CONSTRAINT "verification_pkey" PRIMARY KEY ("id");
CREATE UNIQUE INDEX "verification_value_key" ON "VerificationToken"("value");

-- Step 3f: Remove default from id (should be supplied by application)
ALTER TABLE "VerificationToken" ALTER COLUMN "id" DROP DEFAULT;

-- Step 3g: Rename table to lowercase
ALTER TABLE "VerificationToken" RENAME TO "verification";


-- =====================================================================
-- 4. USER TABLE
-- Convert emailVerified from TIMESTAMP to BOOLEAN;
-- rename table to lowercase.
-- =====================================================================

-- Step 4a: Convert emailVerified from TIMESTAMP? to BOOLEAN DEFAULT false
-- Use USING clause: if the timestamp was non-null, the user was verified (true); null = false
ALTER TABLE "User" ALTER COLUMN "emailVerified" TYPE BOOLEAN USING ("emailVerified" IS NOT NULL);
ALTER TABLE "User" ALTER COLUMN "emailVerified" SET DEFAULT false;
ALTER TABLE "User" ALTER COLUMN "emailVerified" SET NOT NULL;

-- Step 4b: Add createdAt / updatedAt if not already present (they are, so skip)
-- createdAt and updatedAt already exist on User table from previous migrations.

-- Step 4c: Rename table to lowercase
ALTER TABLE "User" RENAME TO "user";

-- Note: PostgreSQL FKs reference table OIDs internally, so renaming the table
-- does not break existing FK constraints from Account/Session/Follow/etc.
-- The FK constraint names (e.g. "Account_userId_fkey") still work correctly
-- because the constraint is bound to the OID, not the name.
