-- CreateEnum
CREATE TYPE "GameRelationshipType" AS ENUM ('SEQUEL', 'PREQUEL', 'DLC', 'EXPANSION', 'REMAKE', 'REMASTER', 'SPIN_OFF', 'SIDE_STORY', 'PARENT_GAME', 'BUNDLE_PART', 'STANDALONE_EXPANSION', 'SIMILAR');

-- CreateTable
CREATE TABLE "Franchise" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Franchise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRelationship" (
    "id" TEXT NOT NULL,
    "type" "GameRelationshipType" NOT NULL,
    "sourceGameId" TEXT NOT NULL,
    "targetGameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FranchiseToGame" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FranchiseToGame_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_slug_key" ON "Franchise"("slug");

-- CreateIndex
CREATE INDEX "GameRelationship_sourceGameId_idx" ON "GameRelationship"("sourceGameId");

-- CreateIndex
CREATE INDEX "GameRelationship_targetGameId_idx" ON "GameRelationship"("targetGameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameRelationship_sourceGameId_targetGameId_type_key" ON "GameRelationship"("sourceGameId", "targetGameId", "type");

-- CreateIndex
CREATE INDEX "_FranchiseToGame_B_index" ON "_FranchiseToGame"("B");

-- AddForeignKey
ALTER TABLE "GameRelationship" ADD CONSTRAINT "GameRelationship_sourceGameId_fkey" FOREIGN KEY ("sourceGameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRelationship" ADD CONSTRAINT "GameRelationship_targetGameId_fkey" FOREIGN KEY ("targetGameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FranchiseToGame" ADD CONSTRAINT "_FranchiseToGame_A_fkey" FOREIGN KEY ("A") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FranchiseToGame" ADD CONSTRAINT "_FranchiseToGame_B_fkey" FOREIGN KEY ("B") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
