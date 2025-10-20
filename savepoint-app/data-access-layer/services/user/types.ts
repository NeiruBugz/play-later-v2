import type { ServiceResult } from "../types";

export type GetUserInput = {
  userId: string;
};

export type UpdateUserInput = {
  userId: string;
  username?: string;
  steamProfileUrl?: string;
};

export type GetSteamIntegrationInput = {
  userId: string;
};

export type DisconnectSteamInput = {
  userId: string;
};

export type GetSteamIdForUserInput = {
  userId: string;
  steamUsername: string;
};

export type UserData = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  steamProfileURL: string | null;
  steamConnectedAt: Date | null;
};

export type SteamIntegrationData = {
  steamId64: string | null;
  steamUsername: string | null;
  steamProfileURL: string | null;
  steamConnectedAt: Date | null;
  isConnected: boolean;
};

export type GetUserResult = ServiceResult<{
  user: UserData;
}>;

export type UpdateUserResult = ServiceResult<{
  user: Partial<UserData>;
  message?: string;
}>;

export type GetSteamIntegrationResult = ServiceResult<{
  integration: SteamIntegrationData;
}>;

export type DisconnectSteamResult = ServiceResult<{
  message: string;
}>;

export type GetSteamIdForUserResult = ServiceResult<{
  steamId64: string | null;
}>;
