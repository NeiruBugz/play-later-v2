/**
 * UserService - Business logic layer for user operations
 *
 * This service handles all business logic for user management.
 * Input validation is handled at the server action layer via Zod.
 * This service focuses on:
 * - Business rule enforcement (e.g., username uniqueness)
 * - Data transformation
 * - Repository orchestration
 * - Error handling
 *
 * @module shared/services/user/user-service
 */

import "server-only";

import {
  disconnectSteam as disconnectSteamRepo,
  getUserInfo,
  getUserSteamData,
  updateUserData,
} from "@/shared/lib/repository/user/user-repository";

import { BaseService, ServiceErrorCode } from "../types";
import type {
  DisconnectSteamInput,
  DisconnectSteamResult,
  GetSteamIntegrationInput,
  GetSteamIntegrationResult,
  GetUserInput,
  GetUserResult,
  UpdateUserInput,
  UpdateUserResult,
} from "./types";

/**
 * UserService class
 *
 * Provides business logic operations for managing users.
 * All methods return ServiceResult discriminated unions for type-safe error handling.
 *
 * @example
 * ```typescript
 * const service = new UserService();
 *
 * // Get user info
 * const result = await service.getUser({
 *   userId: "user-123"
 * });
 *
 * if (result.success) {
 *   console.log(result.data.user); // TypeScript knows user exists
 * } else {
 *   console.error(result.error); // TypeScript knows error exists
 * }
 * ```
 */
export class UserService extends BaseService {
  /**
   * Get user by ID.
   *
   * Fetches user information including basic profile data and Steam connection status.
   *
   * @param input - User ID
   * @returns ServiceResult with user data
   *
   * @example
   * ```typescript
   * const result = await service.getUser({
   *   userId: "user-123"
   * });
   *
   * if (result.success) {
   *   console.log(result.data.user.username);
   *   console.log(result.data.user.email);
   *   console.log(result.data.user.steamConnectedAt);
   * }
   * ```
   */
  async getUser(input: GetUserInput): Promise<GetUserResult> {
    try {
      const user = await getUserInfo({ userId: input.userId });

      if (!user) {
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }

      return this.success({ user });
    } catch (error) {
      return this.handleError(error, "Failed to fetch user");
    }
  }

  /**
   * Update user profile.
   *
   * Business rules:
   * - Username must be unique (enforced by repository/database)
   * - At least one field must be provided for update
   *
   * @param input - Update parameters
   * @returns ServiceResult with updated user data
   *
   * @example
   * ```typescript
   * // Update username
   * const result = await service.updateUser({
   *   userId: "user-123",
   *   username: "newusername"
   * });
   *
   * // Update Steam profile URL
   * const result = await service.updateUser({
   *   userId: "user-123",
   *   steamProfileUrl: "https://steamcommunity.com/id/newprofile"
   * });
   *
   * if (result.success) {
   *   console.log(result.data.user);
   *   console.log(result.data.message);
   * }
   * ```
   */
  async updateUser(input: UpdateUserInput): Promise<UpdateUserResult> {
    try {
      // Validate that at least one field is provided
      if (input.username === undefined && input.steamProfileUrl === undefined) {
        return this.error(
          "At least one field must be provided for update",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const updatedUser = await updateUserData({
        userId: input.userId,
        username: input.username ?? null,
        steamProfileUrl: input.steamProfileUrl ?? null,
      });

      return this.success({
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          steamProfileURL: updatedUser.steamProfileURL,
        },
        message: "User profile updated successfully",
      });
    } catch (error) {
      // Check for unique constraint violation (username already taken)
      if (
        error instanceof Error &&
        (error.message.includes("Unique constraint") ||
          error.message.includes("unique"))
      ) {
        return this.error(
          "Username is already taken",
          ServiceErrorCode.CONFLICT
        );
      }

      // Check for user not found
      if (error instanceof Error && error.message === "User not found") {
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }

      return this.handleError(error, "Failed to update user profile");
    }
  }

  /**
   * Get Steam integration status for a user.
   *
   * Returns Steam connection information including Steam ID, username,
   * profile URL, and connection timestamp.
   *
   * @param input - User ID
   * @returns ServiceResult with Steam integration data
   *
   * @example
   * ```typescript
   * const result = await service.getSteamIntegrationStatus({
   *   userId: "user-123"
   * });
   *
   * if (result.success) {
   *   if (result.data.integration.isConnected) {
   *     console.log("Steam ID:", result.data.integration.steamId64);
   *     console.log("Steam Username:", result.data.integration.steamUsername);
   *   } else {
   *     console.log("Steam is not connected");
   *   }
   * }
   * ```
   */
  async getSteamIntegrationStatus(
    input: GetSteamIntegrationInput
  ): Promise<GetSteamIntegrationResult> {
    try {
      const steamData = await getUserSteamData({ userId: input.userId });

      if (!steamData) {
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }

      return this.success({
        integration: {
          steamId64: steamData.steamId64,
          steamUsername: steamData.steamUsername,
          steamProfileURL: steamData.steamProfileURL,
          steamConnectedAt: steamData.steamConnectedAt,
          isConnected: steamData.steamId64 !== null,
        },
      });
    } catch (error) {
      return this.handleError(error, "Failed to get Steam integration status");
    }
  }

  /**
   * Disconnect Steam integration for a user.
   *
   * Removes all Steam-related data from the user's profile including
   * Steam ID, username, profile URL, avatar, and connection timestamp.
   *
   * @param input - User ID
   * @returns ServiceResult with success message
   *
   * @example
   * ```typescript
   * const result = await service.disconnectSteam({
   *   userId: "user-123"
   * });
   *
   * if (result.success) {
   *   console.log(result.data.message); // "Steam account disconnected successfully"
   * }
   * ```
   */
  async disconnectSteam(
    input: DisconnectSteamInput
  ): Promise<DisconnectSteamResult> {
    try {
      await disconnectSteamRepo({ userId: input.userId });

      return this.success({
        message: "Steam account disconnected successfully",
      });
    } catch (error) {
      return this.handleError(error, "Failed to disconnect Steam account");
    }
  }
}
