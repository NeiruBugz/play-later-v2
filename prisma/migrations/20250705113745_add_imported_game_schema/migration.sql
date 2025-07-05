-- CreateEnum
CREATE TYPE "Storefront" AS ENUM ('STEAM', 'PLAYSTATION', 'XBOX');

-- CreateTable
CREATE TABLE "ImportedGame" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storefront" "Storefront" NOT NULL,
    "storefrontGameId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ImportedGame_pkey" PRIMARY KEY ("id")
);
