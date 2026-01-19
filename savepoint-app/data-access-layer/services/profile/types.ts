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
};
export type GetProfileResult = ServiceResult<{ profile: Profile }>;
export type ProfileWithStats = {
  username: string | null;
  image: string | null;
  email: string | null;
  name: string | null;
  createdAt: Date;
  stats: LibraryStats;
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
