export type JournalEntryPageEntry = {
  id: string;
  kind: "QUICK" | "REFLECTION";
  title: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  game: {
    id: string;
    title: string;
    slug: string;
  } | null;
};

export type JournalEntryPageProps = {
  entry: JournalEntryPageEntry;
};
