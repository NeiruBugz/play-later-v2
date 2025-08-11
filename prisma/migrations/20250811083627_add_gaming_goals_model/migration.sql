-- CreateEnum
CREATE TYPE "GamingGoalType" AS ENUM ('COMPLETE_GAMES', 'COMPLETE_GENRE', 'COMPLETE_PLATFORM', 'REDUCE_BACKLOG', 'PLAY_TIME', 'STREAK', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GamingGoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "GamingGoal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "GamingGoalType" NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "status" "GamingGoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "targetGenre" TEXT[],
    "targetPlatform" TEXT,
    "targetStatus" "BacklogItemStatus"[],

    CONSTRAINT "GamingGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GamingGoal_userId_status_idx" ON "GamingGoal"("userId", "status");

-- CreateIndex
CREATE INDEX "GamingGoal_userId_deadline_idx" ON "GamingGoal"("userId", "deadline");

-- AddForeignKey
ALTER TABLE "GamingGoal" ADD CONSTRAINT "GamingGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
