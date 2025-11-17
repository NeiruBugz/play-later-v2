import type {
  LibraryStats,
  Profile,
  ProfileWithStats,
  RecentGame,
} from "./types";
type MinimalUser = {
  username: string | null;
  image: string | null;
  email: string | null;
  name: string | null;
  createdAt: Date;
};
type LibraryStatsRepo = {
  statusCounts: Record<string, number>;
  recentGames: Array<{
    gameId: string;
    title: string;
    coverImage: string | null;
    lastPlayed: Date;
  }>;
};
export function mapUserToProfile(user: MinimalUser): Profile {
  return {
    username: user.username,
    image: user.image,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}
export function mapRecentGame(item: {
  gameId: string;
  title: string;
  coverImage: string | null;
  lastPlayed: Date;
}): RecentGame {
  return {
    gameId: item.gameId,
    title: item.title,
    coverImage: item.coverImage,
    lastPlayed: item.lastPlayed,
  };
}
export function mapLibraryStats(stats: LibraryStatsRepo): LibraryStats {
  return {
    statusCounts: stats.statusCounts,
    recentGames: stats.recentGames.map(mapRecentGame),
  };
}
export function mapUserToProfileWithStats(
  user: MinimalUser,
  stats: LibraryStatsRepo
): ProfileWithStats {
  return {
    ...mapUserToProfile(user),
    stats: mapLibraryStats(stats),
  };
}
