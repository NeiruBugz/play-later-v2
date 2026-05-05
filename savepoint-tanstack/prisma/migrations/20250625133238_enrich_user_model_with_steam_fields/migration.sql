-- AlterTable
ALTER TABLE "User" ADD COLUMN     "steamAvatar" TEXT,
ADD COLUMN     "steamConnectedAt" TIMESTAMP(3),
ADD COLUMN     "steamId64" TEXT,
ADD COLUMN     "steamUsername" TEXT;
