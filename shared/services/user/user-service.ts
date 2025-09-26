import "server-only";

import { revalidatePath } from "next/cache";

import { BaseService, type ServiceResponse } from "../types";
import { disconnectSteam } from "./actions/disconnect-steam";
import { getSteamUserData } from "./actions/get-steam-user-data";
import { getUserInfo } from "./actions/get-user-info";
import { updateUserProfile } from "./actions/update-user-profile";
import type {
  SteamUserData,
  UpdateUserProfileParams,
  UserInfo,
  UserService as UserServiceInterface,
} from "./types";

export class UserService extends BaseService implements UserServiceInterface {
  async getUserInfo(): Promise<ServiceResponse<UserInfo>> {
    try {
      await this.getCurrentUserId();

      // Call server action instead of repository directly
      const result = await getUserInfo();

      if (!result.data) {
        return this.createErrorResponse({
          message: result.serverError || "Failed to fetch user information",
          code: "FETCH_FAILED",
        });
      }

      return this.createSuccessResponse(result.data);
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to fetch user information",
        code: "FETCH_FAILED",
        cause: serviceError.message,
      });
    }
  }

  async updateUserProfile(
    params: UpdateUserProfileParams
  ): Promise<ServiceResponse<void>> {
    try {
      await this.getCurrentUserId();

      const trimmedUserName = params.username?.trim();

      // Validate input parameters at service level
      if (!trimmedUserName) {
        return this.createErrorResponse({
          message: "Username is required",
          code: "VALIDATION_ERROR",
        });
      }

      // Call server action which handles repository interaction
      const result = await updateUserProfile({
        username: trimmedUserName,
        steamProfileUrl: params.steamProfileUrl ?? null,
      });

      if (!result.data && result.serverError) {
        return this.createErrorResponse({
          message: result.serverError,
          code: "UPDATE_FAILED",
        });
      }

      // Revalidation is handled in the server action
      return this.createSuccessResponse(undefined);
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to update user profile",
        code: "UPDATE_FAILED",
        cause: serviceError.message,
      });
    }
  }

  async getSteamUserData(): Promise<ServiceResponse<SteamUserData>> {
    try {
      await this.getCurrentUserId();

      // Call server action instead of repository directly
      const result = await getSteamUserData();

      if (!result.data) {
        return this.createErrorResponse({
          message: result.serverError || "Failed to fetch Steam user data",
          code: "FETCH_FAILED",
        });
      }

      return this.createSuccessResponse(result.data);
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to fetch Steam user data",
        code: "FETCH_FAILED",
        cause: serviceError.message,
      });
    }
  }

  async disconnectSteam(): Promise<ServiceResponse<SteamUserData>> {
    try {
      await this.getCurrentUserId();

      // Call server action which handles repository interaction
      const result = await disconnectSteam();

      if (!result.data) {
        return this.createErrorResponse({
          message: result.serverError || "Failed to disconnect Steam account",
          code: "DISCONNECT_FAILED",
        });
      }

      // Revalidate relevant pages after disconnecting Steam
      revalidatePath("/user/settings");
      revalidatePath("/dashboard");

      return this.createSuccessResponse(result.data);
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to disconnect Steam account",
        code: "DISCONNECT_FAILED",
        cause: serviceError.message,
      });
    }
  }
}
