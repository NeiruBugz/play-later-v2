export type GetProfileInput = {
  userId: string;
};
export type GetProfileWithStatsInput = {
  userId: string;
};
export type Profile = {
  username: string | null;
  image: string | null;
  email: string | null;
  name: string | null;
  createdAt: Date;
  isPublicProfile: boolean;
};

export type RecentGame = {
  gameId: string;
  title: string;
  coverImage: string | null;
  lastPlayed: Date;
};

export type LibraryStats = {
  statusCounts: Record<string, number>;
  recentGames: RecentGame[];
  journalCount: number;
};
export type RatingHistogramEntry = {
  rating: number;
  count: number;
};
export type ProfileWithStats = {
  username: string | null;
  image: string | null;
  email: string | null;
  name: string | null;
  createdAt: Date;
  isPublicProfile: boolean;
  stats: LibraryStats;
  gameCount: number;
  libraryPreview: LibraryPreviewGame[];
  ratingHistogram: RatingHistogramEntry[];
  ratedCount: number;
};
export type CheckUsernameAvailabilityInput = {
  username: string;
};
export type UpdateProfileInput = {
  userId: string;
  username: string;
  avatarUrl?: string;
  isPublicProfile?: boolean;
};
export type UpdateAvatarUrlInput = {
  userId: string;
  avatarUrl: string;
};
export type CheckSetupStatusInput = {
  userId: string;
};
export type CompleteSetupInput = {
  userId: string;
  username?: string;
  avatarUrl?: string;
};
export type SteamConnectionData = {
  steamId64: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
};
export type SteamConnectionStatus =
  | { connected: false }
  | { connected: true; profile: SteamConnectionData };
export type GetSteamConnectionStatusInput = {
  userId: string;
};
export type LibraryPreviewGame = {
  title: string;
  coverImage: string | null;
  slug: string;
};
export type PublicProfile = {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  gameCount: number;
  libraryPreview: LibraryPreviewGame[];
  isPublicProfile: boolean;
  createdAt: Date;
};
