-- AlterTable
ALTER TABLE "account" RENAME CONSTRAINT "Account_pkey" TO "account_pkey";
ALTER TABLE "account" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "session" RENAME CONSTRAINT "Session_pkey" TO "session_pkey";
ALTER TABLE "session" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user" RENAME CONSTRAINT "User_pkey" TO "user_pkey";

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RenameForeignKey
ALTER TABLE "account" RENAME CONSTRAINT "Account_userId_fkey" TO "account_userId_fkey";

-- RenameForeignKey
ALTER TABLE "session" RENAME CONSTRAINT "Session_userId_fkey" TO "session_userId_fkey";

-- RenameIndex
ALTER INDEX "User_email_key" RENAME TO "user_email_key";

-- RenameIndex
ALTER INDEX "User_usernameNormalized_key" RENAME TO "user_usernameNormalized_key";

-- RenameIndex
ALTER INDEX "User_username_key" RENAME TO "user_username_key";
