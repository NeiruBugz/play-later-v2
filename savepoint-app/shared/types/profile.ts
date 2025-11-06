/**
 * Recent game information for profile display
 */
export type RecentGame = {
  gameId: string;
  title: string;
  coverImage: string | null;
  lastPlayed: Date;
};

/**
 * Library statistics aggregated by status
 */
export type LibraryStats = {
  statusCounts: Record<string, number>;
  recentGames: RecentGame[];
};

/**
 * Profile with aggregated library statistics
 */
export type ProfileWithStats = {
  username: string | null;
  image: string | null;
  email: string | null;
  name: string | null;
  createdAt: Date;
  stats: LibraryStats;
};
