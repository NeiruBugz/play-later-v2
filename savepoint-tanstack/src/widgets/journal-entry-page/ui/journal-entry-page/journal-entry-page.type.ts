export type JournalEntryPageEntry = {
  id: string;
  content: string;
  playedMinutes: number | null;
  createdAt: Date;
  game: {
    id: string;
    title: string;
    slug: string;
  } | null;
};

export type JournalEntryPageProps = {
  entry: JournalEntryPageEntry;
};
