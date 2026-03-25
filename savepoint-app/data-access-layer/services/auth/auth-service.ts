import "server-only";

import {
  createUserWithCredentials,
  findUserByEmail,
} from "@/data-access-layer/repository";

import { createLogger, hashPassword, LOGGER_CONTEXT } from "@/shared/lib";

import {
  handleServiceError,
  serviceError,
  ServiceErrorCode,
  serviceSuccess,
} from "../types";
import { mapToAuthUserData } from "./mappers";
import type { SignUpInput, SignUpResult } from "./types";

export class AuthService {
  private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "AuthService" });
  async signUp(input: SignUpInput): Promise<SignUpResult> {
    try {
      const normalizedEmail = input.email.trim().toLowerCase();
      const existingUser = await findUserByEmail(normalizedEmail);
      if (existingUser) {
        this.logger.warn(
          { userId: "unknown" },
          "Sign up failed: email already exists"
        );
        return serviceError(
          "An account with this email already exists",
          ServiceErrorCode.CONFLICT
        );
      }
      const hashedPassword = await hashPassword(input.password);
      const user = await createUserWithCredentials({
        email: normalizedEmail,
        password: hashedPassword,
        name: input.name ?? null,
      });
      return serviceSuccess({
        user: mapToAuthUserData({
          id: user.id,
          email: user.email ?? normalizedEmail,
          name: user.name,
        }),
        message: "Account created successfully",
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("Unique constraint") ||
          error.message.includes("unique"))
      ) {
        this.logger.warn(
          { userId: "unknown", error },
          "Sign up failed: unique constraint violation"
        );
        return serviceError(
          "An account with this email already exists",
          ServiceErrorCode.CONFLICT
        );
      }
      this.logger.error(
        { error, userId: "unknown" },
        "Error creating user account"
      );
      return handleServiceError(error, "Failed to create account");
    }
  }
}
