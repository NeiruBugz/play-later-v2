import type { ServiceResult } from "../types";

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
export type GetProfileResult = ServiceResult<{ profile: Profile }>;
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
export type GetProfileWithStatsResult = ServiceResult<{
  profile: ProfileWithStats;
}>;
export type CheckUsernameAvailabilityInput = {
  username: string;
};
export type CheckUsernameAvailabilityResult = ServiceResult<{
  available: boolean;
}>;
export type UpdateProfileInput = {
  userId: string;
  username: string;
  avatarUrl?: string;
  isPublicProfile?: boolean;
};
export type UpdateProfileResult = ServiceResult<{
  username: string | null;
  image: string | null;
}>;
export type UpdateAvatarUrlInput = {
  userId: string;
  avatarUrl: string;
};
export type UpdateAvatarUrlResult = ServiceResult<void>;
export type CheckSetupStatusInput = {
  userId: string;
};
export type CheckSetupStatusResult = ServiceResult<{
  needsSetup: boolean;
  suggestedUsername?: string;
}>;
export type CompleteSetupInput = {
  userId: string;
  username?: string;
  avatarUrl?: string;
};
export type CompleteSetupResult = ServiceResult<{
  username: string | null;
  image: string | null;
}>;
export type GetRedirectAfterAuthInput = {
  userId: string;
};
export type GetRedirectAfterAuthResult = ServiceResult<{
  redirectTo: string;
  isNewUser: boolean;
}>;
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
export type GetSteamConnectionStatusResult =
  ServiceResult<SteamConnectionStatus>;
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
export type GetPublicProfileResult = ServiceResult<{
  profile: PublicProfile | null;
}>;
