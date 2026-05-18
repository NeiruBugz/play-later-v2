/**
 * addGameToLibrary — quick-add entry point for the library write layer.
 *
 * Behavior (locked by integration test in
 * `test/integration/add-game-to-library.integration.test.ts`):
 *
 *   1. Game-cache-aware. If a Game row exists for `input.igdbId`, reuse it.
 *      Otherwise, fetch from IGDB via the shared transport and create the
 *      Game row before linking.
 *   2. Application-layer idempotency on `(userId, igdbId)`. The schema has
 *      no `@@unique([userId, gameId])` constraint, so we query first and
 *      return the existing LibraryItem if one is present — no duplicate
 *      row, no `ConflictError`.
 *   3. Schema defaults govern unspecified fields:
 *        - `status` defaults to `SHELF` (Prisma `@default(SHELF)`)
 *        - `acquisitionType` defaults to `DIGITAL` (`@default(DIGITAL)`)
 *      We pass these only when supplied so the DB layer remains the
 *      single source of truth for defaults.
 *   4. `platform` is nullable; absence persists as `null`.
 *
 * Note on FSD: this entity inlines the IGDB cache-or-fetch composition
 * rather than calling `upsertGameFromIgdb` from the `game` entity, since
 * `eslint-plugin-boundaries` forbids entity-to-entity imports. The
 * duplication is ~6 lines and keeps the entity layer flat.
 */
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
  // Idempotency: if this user already has a LibraryItem for this igdbId,
  // return it. Enforced at the application layer (no DB unique constraint).
  const existingItem = await prisma.libraryItem.findFirst({
    where: { userId, game: { igdbId: input.igdbId } },
  });
  if (existingItem) {
    return existingItem;
  }

  // Resolve the Game row, populating from IGDB on cache miss.
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
