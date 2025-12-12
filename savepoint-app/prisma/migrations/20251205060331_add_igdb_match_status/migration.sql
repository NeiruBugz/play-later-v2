-- CreateEnum
CREATE TYPE "IgdbMatchStatus" AS ENUM ('PENDING', 'MATCHED', 'UNMATCHED', 'IGNORED');

-- AlterTable
ALTER TABLE "ImportedGame" ADD COLUMN     "igdbMatchStatus" "IgdbMatchStatus" NOT NULL DEFAULT 'PENDING';
