import {
  getGameByIgdbId,
  mapIgdbReleaseDate,
  type GameDetailsResponseItem,
  type SearchResponseItem,
} from "@/shared/api/igdb";
import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { isUniqueViolationOn } from "@/shared/lib/prisma";

import type { Game } from "../../../../shared/lib/prisma/client.ts";

type GamePayload = Pick<
  SearchResponseItem,
  "id" | "name" | "slug" | "first_release_date" | "release_dates" | "cover"
>;

const MILLISECONDS_PER_DAY = 86_400_000;

function floorToUtcMidnight(unixSeconds: number): Date {
  const milliseconds = unixSeconds * 1000;
  return new Date(
    Math.floor(milliseconds / MILLISECONDS_PER_DAY) * MILLISECONDS_PER_DAY
  );
}

function buildReleaseColumns(payload: GamePayload) {
  const mapped =
    payload.release_dates === undefined
      ? "unknown"
      : mapIgdbReleaseDate(payload);
  if (mapped !== "unknown") {
    return {
      releaseDate: mapped.releaseDate,
      releaseDatePrecision: mapped.precision,
      releaseDateCheckedAt: new Date(),
    };
  }
  return {
    releaseDate:
      typeof payload.first_release_date === "number"
        ? floorToUtcMidnight(payload.first_release_date)
        : null,
    releaseDatePrecision: null,
    releaseDateCheckedAt: null,
  };
}

async function findOrCreateGame(payload: GamePayload): Promise<Game> {
  const existing = await prisma.game.findUnique({
    where: { igdbId: payload.id },
  });
  if (existing) {
    return existing;
  }

  const coverImage = buildCoverImageUrl(payload.cover?.image_id, "t_cover_big");

  try {
    return await prisma.game.create({
      data: {
        igdbId: payload.id,
        title: payload.name,
        slug: payload.slug,
        ...buildReleaseColumns(payload),
        coverImage,
      },
    });
  } catch (error) {
    if (!isUniqueViolationOn(error, ["igdbId"])) throw error;
    const concurrentlyCreated = await prisma.game.findUnique({
      where: { igdbId: payload.id },
    });
    if (!concurrentlyCreated) throw error;
    return concurrentlyCreated;
  }
}

export function upsertGameFromIgdbPayload(
  payload: SearchResponseItem
): Promise<Game> {
  return findOrCreateGame(payload);
}

export function upsertThinGameFromIgdbDetailsPayload(
  payload: GameDetailsResponseItem
): Promise<Game> {
  return findOrCreateGame(payload);
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
