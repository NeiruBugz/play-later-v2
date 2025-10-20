import "server-only";

import {
  disconnectSteam as disconnectSteamRepo,
  getUserInfo,
  getUserSteamData,
  getUserSteamId,
  updateUserData,
} from "@/data-access-layer/repository/user/user-repository";

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

  async updateUser(input: UpdateUserInput): Promise<UpdateUserResult> {
    try {
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

      if (error instanceof Error && error.message === "User not found") {
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }

      return this.handleError(error, "Failed to update user profile");
    }
  }

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

  async getSteamIdForUser(
    input: GetSteamIdForUserInput
  ): Promise<GetSteamIdForUserResult> {
    try {
      const res = await getUserSteamId({
        steamUsername: input.steamUsername,
        userId: input.userId,
      });
      return this.success({ steamId64: res?.steamId64 ?? null });
    } catch (error) {
      return this.handleError(error, "Failed to fetch Steam ID for user");
    }
  }
}
