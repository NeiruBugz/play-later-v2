// The IGDB cache-or-fetch is inlined here rather than calling upsertGameFromIgdb
// from entities/game because eslint-plugin-boundaries forbids entity-to-entity imports.
import { getGameByIgdbId } from "@/shared/api/igdb";
import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import type {
  LibraryItem,
  LibraryItemStatus,
} from "../../../../shared/lib/prisma/client.ts";

const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";

function buildCoverUrl(imageId: string): string {
  return `${IGDB_IMAGE_BASE}/t_cover_big/${imageId}.jpg`;
}

export interface AddGameToLibraryInput {
  igdbId: number;
  status?: LibraryItemStatus;
  platform?: string;
}

export async function addGameToLibrary(
  userId: string,
  input: AddGameToLibraryInput
): Promise<LibraryItem> {
  const existingItem = await prisma.libraryItem.findFirst({
    where: { userId, game: { igdbId: input.igdbId } },
  });
  if (existingItem) {
    return existingItem;
  }

  let game = await prisma.game.findUnique({
    where: { igdbId: input.igdbId },
  });

  if (!game) {
    const remote = await getGameByIgdbId(input.igdbId);
    if (!remote) {
      throw new NotFoundError("Game not found in IGDB", {
        igdbId: input.igdbId,
      });
    }

    const releaseDate =
      typeof remote.first_release_date === "number"
        ? new Date(remote.first_release_date * 1000)
        : null;

    const coverImage = remote.cover?.image_id
      ? buildCoverUrl(remote.cover.image_id)
      : null;

    game = await prisma.game.create({
      data: {
        igdbId: remote.id,
        title: remote.name,
        slug: remote.slug,
        releaseDate,
        coverImage,
      },
    });
  }

  return prisma.libraryItem.create({
    data: {
      userId,
      gameId: game.id,
      ...(input.status !== undefined && { status: input.status }),
      platform: input.platform ?? null,
    },
  });
}
