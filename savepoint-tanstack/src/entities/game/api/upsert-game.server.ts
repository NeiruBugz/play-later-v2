import {
  getGameByIgdbId,
  type GameDetailsResponseItem,
  type SearchResponseItem,
} from "@/shared/api/igdb";
import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";

import type { Game } from "../../../../shared/lib/prisma/client.ts";

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

  const coverImage = buildCoverImageUrl(payload.cover?.image_id, "t_cover_big");

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

  const coverImage = buildCoverImageUrl(payload.cover?.image_id, "t_cover_big");

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
