/**
 * Cache-first IGDB → Game upsert.
 *
 * Behavior:
 *   1. If a Game row already exists for the given `igdbId`, return it without
 *      calling IGDB.
 *   2. Otherwise, fetch the IGDB game by id, map fields, insert a new Game.
 *   3. Empty IGDB result (game not found upstream) → `NotFoundError`.
 *   4. IGDB transport / non-2xx / malformed response → `UpstreamError`
 *      (already thrown by `getGameByIgdbId`).
 *
 * No DI, no classes, no Result wrapper — per C2 DAL conventions
 * (see savepoint-tanstack/CLAUDE.md → "DAL conventions").
 */
import { getGameByIgdbId } from "@/shared/api/igdb";
import { prisma } from "@/shared/lib/db";
import { NotFoundError } from "@/shared/lib/errors";

import type { Game } from "../../../../shared/lib/prisma/client.ts";

const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";

function buildCoverUrl(imageId: string): string {
  return `${IGDB_IMAGE_BASE}/t_cover_big/${imageId}.jpg`;
}

export async function upsertGameFromIgdb(igdbId: number): Promise<Game> {
  // Cache hit — return existing row, never touch IGDB.
  const existing = await prisma.game.findUnique({ where: { igdbId } });
  if (existing) {
    return existing;
  }

  // Cache miss — fetch from IGDB.
  const remote = await getGameByIgdbId(igdbId);
  if (!remote) {
    throw new NotFoundError("Game not found in IGDB", { igdbId });
  }

  const releaseDate =
    typeof remote.first_release_date === "number"
      ? new Date(remote.first_release_date * 1000)
      : null;

  const coverImage = remote.cover?.image_id
    ? buildCoverUrl(remote.cover.image_id)
    : null;

  return prisma.game.create({
    data: {
      igdbId: remote.id,
      title: remote.name,
      slug: remote.slug,
      releaseDate,
      coverImage,
    },
  });
}
