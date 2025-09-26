// User service types

import type { ServiceResponse } from "../types";

// Re-export ServiceResponse for external use
export type { ServiceResponse };

export type UserInfo = {
  id: string;
  name: string | null;
  username: string | null;
  steamProfileURL: string | null;
  steamConnectedAt: Date | null;
  email: string | null;
};

export type UpdateUserProfileParams = {
  username: string;
  steamProfileUrl?: string | null;
};

export type SteamUserData = {
  id: string;
  steamId64: string | null;
  steamUsername: string | null;
  steamProfileURL: string | null;
  steamAvatar: string | null;
  steamConnectedAt: Date | null;
};

export interface UserService {
  getUserInfo(): Promise<ServiceResponse<UserInfo>>;
  updateUserProfile(
    params: UpdateUserProfileParams
  ): Promise<ServiceResponse<void>>;
  getSteamUserData(): Promise<ServiceResponse<SteamUserData>>;
  disconnectSteam(): Promise<ServiceResponse<SteamUserData>>;
}
