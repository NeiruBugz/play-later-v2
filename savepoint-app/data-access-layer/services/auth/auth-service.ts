import "server-only";

import {
  createUserWithCredentials,
  findUserByEmail,
} from "@/data-access-layer/repository";

import { createLogger, hashPassword, LOGGER_CONTEXT } from "@/shared/lib";

import { BaseService, ServiceErrorCode } from "../types";
import { mapToAuthUserData } from "./mappers";
import type {
  SignInInput,
  SignInResult,
  SignUpInput,
  SignUpResult,
} from "./types";

export class AuthService extends BaseService {
  private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "AuthService" });

  async signUp(input: SignUpInput): Promise<SignUpResult> {
    try {
      this.logger.info({ userId: "unknown" }, "User sign up attempt");

      const normalizedEmail = input.email.trim().toLowerCase();
      const existingUser = await findUserByEmail(normalizedEmail);

      if (existingUser) {
        this.logger.warn(
          { userId: "unknown" },
          "Sign up failed: email already exists"
        );
        return this.error(
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

      this.logger.info(
        { userId: user.id },
        "User account created successfully"
      );

      return this.success({
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
        return this.error(
          "An account with this email already exists",
          ServiceErrorCode.CONFLICT
        );
      }

      this.logger.error(
        { error, userId: "unknown" },
        "Error creating user account"
      );
      return this.handleError(error, "Failed to create account");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async signIn(_input: SignInInput): Promise<SignInResult> {
    try {
      return this.error(
        "Sign in should be handled through NextAuth",
        ServiceErrorCode.VALIDATION_ERROR
      );
    } catch (error) {
      return this.handleError(error, "Failed to sign in");
    }
  }
}
