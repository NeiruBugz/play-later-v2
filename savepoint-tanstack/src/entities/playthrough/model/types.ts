import type {
  JournalEntry,
  LibraryItem,
  Playthrough,
  PlaythroughKind,
  PlaythroughStatus,
} from "../../../../shared/lib/prisma/client.ts";

export type PlaythroughWithEntries = Playthrough & {
  journalEntries: JournalEntry[];
  libraryItem?: LibraryItem;
};

export type ProfilePlaythrough = {
  id: string;
  kind: PlaythroughKind;
  status: PlaythroughStatus;
  platform: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  rating: number | null;
  notes: string | null;
  game: { title: string; slug: string; coverImage: string | null };
};
