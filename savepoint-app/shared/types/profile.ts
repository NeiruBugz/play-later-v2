export type RecentGame = {
  gameId: string;
  title: string;
  coverImage: string | null;
  lastPlayed: Date;
};

export type LibraryStats = {
  statusCounts: Record<string, number>;
  recentGames: RecentGame[];
};

export type ProfileWithStats = {
  username: string | null;
  image: string | null;
  email: string | null;
  name: string | null;
  createdAt: Date;
  stats: LibraryStats;
};

export type UpdateProfileFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  submittedUsername?: string;
};
