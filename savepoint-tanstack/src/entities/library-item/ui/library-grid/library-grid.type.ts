export type LibraryGridGame = {
  gameId: string;
  title: string;
  coverImage: string | null;
};

export type LibraryGridProps = {
  games: LibraryGridGame[];
};
