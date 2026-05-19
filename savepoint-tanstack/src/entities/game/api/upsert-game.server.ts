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
 * The Game row is intentionally THIN — title, slug, releaseDate, cover only.
 * Rich detail fields (summary, genres, platforms, screenshots, companies,
 * rating, themes, franchise) are NEVER persisted from the detail page. They
 * are served live from IGDB by `shared/api/igdb/get-game-details-by-slug.ts`
 * and consumed directly by the widget — mirroring canonical's dual-track
 * pattern in `savepoint-app/features/game-detail/use-cases/get-game-details.ts`.
 *
 * No DI, no classes, no Result wrapper — per C2 DAL conventions
 * (see savepoint-tanstack/CLAUDE.md → "DAL conventions").
 */
import {
  getGameByIgdbId,
  type GameDetailsResponseItem,
  type SearchResponseItem,
} from "@/shared/api/igdb";
import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import type { Game } from "../../../../shared/lib/prisma/client.ts";

const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";

function buildCoverUrl(imageId: string): string {
  return `${IGDB_IMAGE_BASE}/t_cover_big/${imageId}.jpg`;
}

/**
 * Cache-first upsert keyed on a pre-fetched IGDB search payload. Used by the
 * search / quick-add path. Cache hit by `igdbId` returns existing row; cache
 * miss inserts a new Game from the payload.
 */
export async function upsertGameFromIgdbPayload(
  payload: SearchResponseItem
): Promise<Game> {
  const existing = await prisma.game.findUnique({
    where: { igdbId: payload.id },
  });
  if (existing) {
    return existing;
  }

  const releaseDate =
    typeof payload.first_release_date === "number"
      ? new Date(payload.first_release_date * 1000)
      : null;

  const coverImage = payload.cover?.image_id
    ? buildCoverUrl(payload.cover.image_id)
    : null;

  return prisma.game.create({
    data: {
      igdbId: payload.id,
      title: payload.name,
      slug: payload.slug,
      releaseDate,
      coverImage,
    },
  });
}

/**
 * Cache-first thin upsert from a rich IGDB detail payload. Only writes the
 * minimum needed for cross-feature lookups (LibraryItem → Game.id, etc.) —
 * mirrors `upsertGameFromIgdbPayload` shape but adapts the rich detail
 * payload's field layout. The rich fields stay on the IGDB payload and are
 * NOT persisted.
 */
export async function upsertThinGameFromIgdbDetailsPayload(
  payload: GameDetailsResponseItem
): Promise<Game> {
  const existing = await prisma.game.findUnique({
    where: { igdbId: payload.id },
  });
  if (existing) {
    return existing;
  }

  const releaseDate =
    typeof payload.first_release_date === "number"
      ? new Date(payload.first_release_date * 1000)
      : null;

  const coverImage = payload.cover?.image_id
    ? buildCoverUrl(payload.cover.image_id)
    : null;

  return prisma.game.create({
    data: {
      igdbId: payload.id,
      title: payload.name,
      slug: payload.slug,
      releaseDate,
      coverImage,
    },
  });
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

  return upsertGameFromIgdbPayload(remote);
}
