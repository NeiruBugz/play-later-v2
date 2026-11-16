import type { SearchResponseItem } from "@/shared/api/igdb";
import { createLogger } from "@/shared/lib";
import { prisma } from "@/shared/lib/db.server";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";

import { buildReleaseColumns } from "./upsert-game.server";

const logger = createLogger({ service: "upsert-games-from-igdb-batch" });

/**
 * Create the games missing from the catalogue in one `INSERT ... ON CONFLICT DO
 * NOTHING`, then read every requested game back. Existing games are never
 * overwritten. Returns `igdbId -> Game.id`.
 *
 * A new game whose `slug` already belongs to a different game is skipped by the
 * insert (the unique slug conflicts) and is therefore absent from the result;
 * callers treat it as not found.
 */
export async function upsertGamesFromIgdbBatch(
  payloads: SearchResponseItem[]
): Promise<Map<number, string>> {
  const unique = [...new Map(payloads.map((p) => [p.id, p])).values()];
  if (unique.length === 0) return new Map();

  await prisma.game.createMany({
    data: unique.map((payload) => ({
      igdbId: payload.id,
      title: payload.name,
      slug: payload.slug,
      coverImage: buildCoverImageUrl(payload.cover?.image_id, "t_cover_big"),
      ...buildReleaseColumns(payload),
    })),
    skipDuplicates: true,
  });

  const stored = await prisma.game.findMany({
    where: { igdbId: { in: unique.map((p) => p.id) } },
    select: { id: true, igdbId: true },
  });
  const idByIgdbId = new Map(stored.map((g) => [g.igdbId, g.id]));

  const skipped = unique.filter((p) => !idByIgdbId.has(p.id));
  if (skipped.length > 0) {
    logger.warn(
      { skipped: skipped.map((p) => ({ igdbId: p.id, slug: p.slug })) },
      "Games skipped: slug belongs to another catalogue game"
    );
  }

  return idByIgdbId;
}
