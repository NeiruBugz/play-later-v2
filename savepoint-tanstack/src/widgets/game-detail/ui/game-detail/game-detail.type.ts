import type {
  Game,
  JournalEntry,
  LibraryItem,
} from "../../../../../shared/lib/prisma/client.ts";

export type GameDetailData = {
  game: Game;
  relatedGames: Game[];
  libraryEntry: LibraryItem | null;
  journalTeaser: JournalEntry[];
};

export type GameDetailProps = {
  data: GameDetailData;
  /** Authenticated viewer's user id, or `null` for anonymous viewers. */
  viewerUserId: string | null;
};
