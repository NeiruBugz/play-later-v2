import type { LibraryItem } from "../../../../../shared/lib/prisma/client.ts";
import type { GameNote } from "../game-notes-list";
import type { Play } from "../play-history";

export type YourPlayCardProps = {
  entry: LibraryItem;
  gameTitle: string;
  gameSlug: string;
  prompts?: { why: boolean; stayed: boolean };
  notes: GameNote[];
  history: Play[];
  playtimeTotalMinutes: number;
  playtimeSessionCount: number;
};
