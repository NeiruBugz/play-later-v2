-- Soft-delete duplicate live ImportedGame rows (same user + storefront +
-- storefrontGameId). The survivor is the row the user already acted on
-- (MATCHED, then IGNORED), then the most recently updated one. Required before
-- the partial unique index below can be built. Rows are never hard-deleted.
UPDATE "ImportedGame" ig
SET "deletedAt" = now()
FROM (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY "userId", "storefront", "storefrontGameId"
           ORDER BY
             CASE "igdbMatchStatus"
               WHEN 'MATCHED' THEN 0
               WHEN 'IGNORED' THEN 1
               ELSE 2
             END,
             "updatedAt" DESC, "createdAt" DESC, id DESC
         ) AS rn
  FROM "ImportedGame"
  WHERE "deletedAt" IS NULL AND "storefrontGameId" IS NOT NULL
) ranked
WHERE ig.id = ranked.id AND ranked.rn > 1;

-- Partial unique index: one live row per game per user per storefront.
-- Prisma cannot express partial indexes; this index is unmanaged by schema.prisma
-- (see FOOT-GUNS.md). upsertImportedGamesBatch targets it via ON CONFLICT.
CREATE UNIQUE INDEX "ImportedGame_live_userId_storefront_storefrontGameId_key"
ON "ImportedGame" ("userId", "storefront", "storefrontGameId")
WHERE "deletedAt" IS NULL;

-- DropForeignKey
ALTER TABLE "IgnoredImportedGames" DROP CONSTRAINT "IgnoredImportedGames_userId_fkey";

-- DropForeignKey
ALTER TABLE "ImportedGame" DROP CONSTRAINT "ImportedGame_userId_fkey";

-- DropForeignKey
ALTER TABLE "LibraryItem" DROP CONSTRAINT "LibraryItem_userId_fkey";

-- DropIndex
DROP INDEX "Follow_followerId_idx";

-- DropIndex
DROP INDEX "Game_slug_idx";

-- DropIndex
DROP INDEX "GameGenre_gameId_idx";

-- DropIndex
DROP INDEX "GamePlatform_gameId_idx";

-- DropIndex
DROP INDEX "Genre_name_idx";

-- DropIndex
DROP INDEX "Genre_slug_idx";

-- DropIndex
DROP INDEX "Platform_name_idx";

-- DropIndex
DROP INDEX "Platform_slug_idx";

-- DropIndex
DROP INDEX "Playthrough_libraryItemId_idx";

-- AddForeignKey
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IgnoredImportedGames" ADD CONSTRAINT "IgnoredImportedGames_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportedGame" ADD CONSTRAINT "ImportedGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
