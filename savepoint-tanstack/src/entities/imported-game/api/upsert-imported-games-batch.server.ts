import { prisma } from "@/shared/lib/db.server";

import type {
  SteamImportedGameInput,
  UpsertImportedGamesBatchResult,
} from "../model/types";

/**
 * Upsert a batch of Steam-shaped payloads inside a single transaction.
 *
 * Idempotency strategy: composite of `(userId, storefront=STEAM,
 * storefrontGameId)`. The schema does not declare a unique constraint on
 * this composite (only indexes), so we use `findFirst` + `update`-or-`create`
 * within `$transaction` — slower than `upsert`, but correct given the schema.
 *
 * New rows are created with `igdbMatchStatus: "PENDING"` (canonical default).
 * Existing rows have their playtime + last-played metadata refreshed; their
 * `igdbMatchStatus` is preserved (a user who previously dismissed a game
 * does not re-surface it via re-import).
 */
export async function upsertImportedGamesBatch(
  userId: string,
  games: SteamImportedGameInput[]
): Promise<UpsertImportedGamesBatchResult> {
  if (games.length === 0) {
    return { created: 0, updated: 0 };
  }

  return prisma.$transaction(async (tx) => {
    const ids = games.map((g) => g.storefrontGameId);
    const existing = await tx.importedGame.findMany({
      where: {
        userId,
        storefront: "STEAM",
        storefrontGameId: { in: ids },
        deletedAt: null,
      },
      select: { id: true, storefrontGameId: true },
    });
    const existingMap = new Map(
      existing.map((row) => [row.storefrontGameId, row.id])
    );

    let created = 0;
    let updated = 0;
    const now = new Date();

    for (const game of games) {
      const existingId = existingMap.get(game.storefrontGameId);
      if (existingId) {
        await tx.importedGame.update({
          where: { id: existingId },
          data: {
            name: game.name,
            playtime: game.playtime,
            playtimeWindows: game.playtimeWindows,
            playtimeMac: game.playtimeMac,
            playtimeLinux: game.playtimeLinux,
            lastPlayedAt: game.lastPlayedAt,
            img_icon_url: game.imgIconUrl,
            img_logo_url: game.imgLogoUrl,
            updatedAt: now,
          },
        });
        updated += 1;
      } else {
        await tx.importedGame.create({
          data: {
            userId,
            name: game.name,
            storefront: "STEAM",
            storefrontGameId: game.storefrontGameId,
            playtime: game.playtime,
            playtimeWindows: game.playtimeWindows,
            playtimeMac: game.playtimeMac,
            playtimeLinux: game.playtimeLinux,
            lastPlayedAt: game.lastPlayedAt,
            img_icon_url: game.imgIconUrl,
            img_logo_url: game.imgLogoUrl,
            igdbMatchStatus: "PENDING",
          },
        });
        created += 1;
      }
    }

    return { created, updated };
  });
}
