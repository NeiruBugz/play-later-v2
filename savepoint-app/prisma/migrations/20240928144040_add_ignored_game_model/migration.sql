-- CreateTable
CREATE TABLE "IgnoredImportedGames" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "IgnoredImportedGames_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IgnoredImportedGames" ADD CONSTRAINT "IgnoredImportedGames_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
