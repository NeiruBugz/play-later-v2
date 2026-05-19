import {
  getGameDetailsFromIgdb,
  type GameDetailsResponseItem,
} from "@/shared/api/igdb";
import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import type {
  Game,
  JournalEntry,
  LibraryItem,
} from "../../../../shared/lib/prisma/client.ts";
import { upsertThinGameFromIgdbDetailsPayload } from "./upsert-game.server";

const JOURNAL_TEASER_LIMIT = 3;

export interface GameDetails {
  game: Game;
  igdbDetails: GameDetailsResponseItem;
  relatedGames: Game[];
  libraryEntry: LibraryItem | null;
  journalTeaser: JournalEntry[];
}

export async function getGameDetails(params: {
  slug: string;
  userId?: string;
}): Promise<GameDetails> {
  const { slug, userId } = params;

  const igdbDetails = await getGameDetailsFromIgdb(slug);
  if (!igdbDetails) {
    throw new NotFoundError("Game not found", { slug });
  }

  const game = await upsertThinGameFromIgdbDetailsPayload(igdbDetails);

  let libraryEntry: LibraryItem | null = null;
  let journalTeaser: JournalEntry[] = [];

  if (userId) {
    [libraryEntry, journalTeaser] = await Promise.all([
      prisma.libraryItem.findFirst({
        where: { userId, gameId: game.id },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.journalEntry.findMany({
        where: { userId, gameId: game.id },
        orderBy: { createdAt: "desc" },
        take: JOURNAL_TEASER_LIMIT,
      }),
    ]);
  }

  // relatedGames kept for backward-compat; live surface is deferredRelatedGames in the loader.
  const relatedGames: Game[] = [];

  return { game, igdbDetails, relatedGames, libraryEntry, journalTeaser };
}
