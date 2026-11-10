import { prisma } from "@/shared/lib/db.server";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";
import type {
  SteamImportedGameInput,
  UpsertImportedGamesBatchResult,
} from "../model/types";

const CHUNK_SIZE = 500;

/**
 * Upsert Steam-shaped payloads, one multi-row `INSERT ... ON CONFLICT` per
 * chunk of {@link CHUNK_SIZE}.
 *
 * Idempotency rests on the partial unique index
 * `ImportedGame_live_userId_storefront_storefrontGameId_key` on
 * `(userId, storefront, storefrontGameId) WHERE deletedAt IS NULL`
 * (raw-SQL migration, invisible to `schema.prisma`): concurrent imports of the
 * same library converge on one live row per game, and soft-deleted rows never
 * collide with a re-import.
 *
 * New rows are created with `igdbMatchStatus: "PENDING"`. Conflicting rows get
 * their name, playtime and artwork refreshed; `igdbMatchStatus` is preserved (a
 * user who dismissed a game does not re-surface it via re-import).
 *
 * Chunks run sequentially without an interactive transaction, so a failure
 * mid-way leaves earlier chunks written; re-running the import is safe.
 */
export async function upsertImportedGamesBatch(
  userId: string,
  games: SteamImportedGameInput[]
): Promise<UpsertImportedGamesBatchResult> {
  const unique = [
    ...new Map(games.map((g) => [g.storefrontGameId, g])).values(),
  ].sort((a, b) => a.storefrontGameId.localeCompare(b.storefrontGameId));

  let created = 0;
  for (let i = 0; i < unique.length; i += CHUNK_SIZE) {
    created += await upsertChunk(userId, unique.slice(i, i + CHUNK_SIZE));
  }

  return { created, updated: unique.length - created };
}

async function upsertChunk(
  userId: string,
  chunk: SteamImportedGameInput[]
): Promise<number> {
  const values = chunk.map(
    (g) => Prisma.sql`(
      gen_random_uuid()::text,
      ${userId},
      'STEAM'::"Storefront",
      ${g.storefrontGameId},
      ${g.name},
      ${g.playtime}::int,
      ${g.playtimeWindows}::int,
      ${g.playtimeMac}::int,
      ${g.playtimeLinux}::int,
      ${g.lastPlayedAt?.toISOString() ?? null}::timestamp(3),
      ${g.imgIconUrl},
      ${g.imgLogoUrl}
    )`
  );

  const rows = await prisma.$queryRaw<Array<{ inserted: boolean }>>`
    INSERT INTO "ImportedGame" (
      "id", "userId", "storefront", "storefrontGameId", "name",
      "playtime", "playtimeWindows", "playtimeMac", "playtimeLinux",
      "lastPlayedAt", "img_icon_url", "img_logo_url", "updatedAt"
    )
    SELECT v.*, now() FROM (VALUES ${Prisma.join(values)}) AS v(
      "id", "userId", "storefront", "storefrontGameId", "name",
      "playtime", "playtimeWindows", "playtimeMac", "playtimeLinux",
      "lastPlayedAt", "img_icon_url", "img_logo_url"
    )
    ON CONFLICT ("userId", "storefront", "storefrontGameId")
      WHERE "deletedAt" IS NULL
    DO UPDATE SET
      "name" = EXCLUDED."name",
      "playtime" = EXCLUDED."playtime",
      "playtimeWindows" = EXCLUDED."playtimeWindows",
      "playtimeMac" = EXCLUDED."playtimeMac",
      "playtimeLinux" = EXCLUDED."playtimeLinux",
      "lastPlayedAt" = EXCLUDED."lastPlayedAt",
      "img_icon_url" = EXCLUDED."img_icon_url",
      "img_logo_url" = EXCLUDED."img_logo_url",
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING (xmax = 0) AS inserted
  `;

  return rows.filter((r) => r.inserted).length;
}
