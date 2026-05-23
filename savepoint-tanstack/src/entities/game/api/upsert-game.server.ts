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
  const existing = await prisma.game.findUnique({ where: { igdbId } });
  if (existing) {
    return existing;
  }

  const remote = await getGameByIgdbId(igdbId);
  if (!remote) {
    throw new NotFoundError("Game not found in IGDB", { igdbId });
  }

  return upsertGameFromIgdbPayload(remote);
}
