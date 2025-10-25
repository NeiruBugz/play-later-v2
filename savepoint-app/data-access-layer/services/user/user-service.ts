import "server-only";

import {
  disconnectSteam as disconnectSteamRepo,
  getUserInfo,
  getUserSteamData,
  getUserSteamId,
  updateUserData,
} from "@/data-access-layer/repository/user/user-repository";

import { createLogger } from "@/shared/lib";

import { BaseService, ServiceErrorCode } from "../types";
import type {
  DisconnectSteamInput,
  DisconnectSteamResult,
  GetSteamIdForUserInput,
  GetSteamIdForUserResult,
  GetSteamIntegrationInput,
  GetSteamIntegrationResult,
  GetUserInput,
  GetUserResult,
  UpdateUserInput,
  UpdateUserResult,
} from "./types";

export class UserService extends BaseService {
  private logger = createLogger({ service: "UserService" });
  async getUser(input: GetUserInput): Promise<GetUserResult> {
    try {
      this.logger.info({ userId: input.userId }, "Fetching user info");

      const user = await getUserInfo({ userId: input.userId });

      if (!user) {
        this.logger.warn({ userId: input.userId }, "User not found");
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }

      this.logger.info(
        { userId: input.userId },
        "User info fetched successfully"
      );
      return this.success({ user });
    } catch (error) {
      this.logger.error(
        { err: error, userId: input.userId },
        "Error fetching user"
      );
      return this.handleError(error, "Failed to fetch user");
    }
  }

  async updateUser(input: UpdateUserInput): Promise<UpdateUserResult> {
    try {
      this.logger.info(
        {
          userId: input.userId,
          hasUsername: !!input.username,
          hasSteamUrl: !!input.steamProfileUrl,
        },
        "Updating user profile"
      );

      if (input.username === undefined && input.steamProfileUrl === undefined) {
        this.logger.warn(
          { userId: input.userId },
          "Update failed: no fields provided"
        );
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

      this.logger.info(
        { userId: updatedUser.id, username: updatedUser.username },
        "User profile updated successfully"
      );

      return this.success({
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          steamProfileURL: updatedUser.steamProfileURL,
        },
        message: "User profile updated successfully",
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("Unique constraint") ||
          error.message.includes("unique"))
      ) {
        this.logger.warn(
          { userId: input.userId, username: input.username, err: error },
          "Update failed: username already taken"
        );
        return this.error(
          "Username is already taken",
          ServiceErrorCode.CONFLICT
        );
      }

      if (error instanceof Error && error.message === "User not found") {
        this.logger.warn(
          { userId: input.userId },
          "Update failed: user not found"
        );
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }

      this.logger.error(
        { err: error, userId: input.userId },
        "Error updating user profile"
      );
      return this.handleError(error, "Failed to update user profile");
    }
  }

  async getSteamIntegrationStatus(
    input: GetSteamIntegrationInput
  ): Promise<GetSteamIntegrationResult> {
    try {
      this.logger.info(
        { userId: input.userId },
        "Fetching Steam integration status"
      );

      const steamData = await getUserSteamData({ userId: input.userId });

      if (!steamData) {
        this.logger.warn({ userId: input.userId }, "User not found");
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }

      const isConnected = steamData.steamId64 !== null;
      this.logger.info(
        {
          userId: input.userId,
          isConnected,
          steamUsername: steamData.steamUsername,
        },
        "Steam integration status fetched"
      );

      return this.success({
        integration: {
          steamId64: steamData.steamId64,
          steamUsername: steamData.steamUsername,
          steamProfileURL: steamData.steamProfileURL,
          steamConnectedAt: steamData.steamConnectedAt,
          isConnected,
        },
      });
    } catch (error) {
      this.logger.error(
        { err: error, userId: input.userId },
        "Error fetching Steam integration status"
      );
      return this.handleError(error, "Failed to get Steam integration status");
    }
  }

  async disconnectSteam(
    input: DisconnectSteamInput
  ): Promise<DisconnectSteamResult> {
    try {
      this.logger.info({ userId: input.userId }, "Disconnecting Steam account");

      await disconnectSteamRepo({ userId: input.userId });

      this.logger.info(
        { userId: input.userId },
        "Steam account disconnected successfully"
      );

      return this.success({
        message: "Steam account disconnected successfully",
      });
    } catch (error) {
      this.logger.error(
        { err: error, userId: input.userId },
        "Error disconnecting Steam account"
      );
      return this.handleError(error, "Failed to disconnect Steam account");
    }
  }

  async getSteamIdForUser(
    input: GetSteamIdForUserInput
  ): Promise<GetSteamIdForUserResult> {
    try {
      this.logger.info(
        { userId: input.userId, steamUsername: input.steamUsername },
        "Fetching Steam ID for user"
      );

      const res = await getUserSteamId({
        steamUsername: input.steamUsername,
        userId: input.userId,
      });

      this.logger.info(
        { userId: input.userId, steamId64: res?.steamId64 },
        "Steam ID fetched"
      );

      return this.success({ steamId64: res?.steamId64 ?? null });
    } catch (error) {
      this.logger.error(
        {
          err: error,
          userId: input.userId,
          steamUsername: input.steamUsername,
        },
        "Error fetching Steam ID"
      );
      return this.handleError(error, "Failed to fetch Steam ID for user");
    }
  }
}
