/**
 * UserService Types
 *
 * Type definitions for the user service layer.
 * Input validation is handled at the server action layer via Zod.
 * These types focus on service layer inputs and outputs.
 *
 * @module shared/services/user/types
 */

import type { ServiceResult } from "../types";

// ============================================================================
// Input Types
// ============================================================================

/**
 * Input for getting a user by ID.
 */
export type GetUserInput = {
  userId: string;
};

/**
 * Input for updating user profile.
 */
export type UpdateUserInput = {
  userId: string;
  username?: string;
  steamProfileUrl?: string;
};

/**
 * Input for getting Steam integration status.
 */
export type GetSteamIntegrationInput = {
  userId: string;
};

/**
 * Input for disconnecting Steam integration.
 */
export type DisconnectSteamInput = {
  userId: string;
};

// ============================================================================
// Output Types
// ============================================================================

/**
 * User data structure returned by service methods.
 */
export type UserData = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  steamProfileURL: string | null;
  steamConnectedAt: Date | null;
};

/**
 * Steam integration data structure.
 */
export type SteamIntegrationData = {
  steamId64: string | null;
  steamUsername: string | null;
  steamProfileURL: string | null;
  steamConnectedAt: Date | null;
  isConnected: boolean;
};

/**
 * Result type for getting a user.
 */
export type GetUserResult = ServiceResult<{
  user: UserData;
}>;

/**
 * Result type for updating a user.
 */
export type UpdateUserResult = ServiceResult<{
  user: Partial<UserData>;
  message?: string;
}>;

/**
 * Result type for getting Steam integration status.
 */
export type GetSteamIntegrationResult = ServiceResult<{
  integration: SteamIntegrationData;
}>;

/**
 * Result type for disconnecting Steam.
 */
export type DisconnectSteamResult = ServiceResult<{
  message: string;
}>;
