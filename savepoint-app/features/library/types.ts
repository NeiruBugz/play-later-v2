export type LibraryItemDomain = import("@prisma/client").LibraryItem;

export type LibraryItemWithGameDomain = import("@prisma/client").LibraryItem & {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
    slug: string;
    releaseDate: Date | null;
    _count: {
      libraryItems: number;
    };
  };
};
