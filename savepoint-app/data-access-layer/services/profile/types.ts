import type { RecentGame as RepositoryRecentGame } from "@/data-access-layer/repository/library/types";

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

export type RecentGame = RepositoryRecentGame;

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

export type GetProfileResult = ServiceResult<{ profile: Profile }>;

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

// Determines where to send the user right after auth
export type GetRedirectAfterAuthInput = {
  userId: string;
};

export type GetRedirectAfterAuthResult = ServiceResult<{
  redirectTo: string; // "/profile/setup" or "/dashboard"
  isNewUser: boolean;
}>;
