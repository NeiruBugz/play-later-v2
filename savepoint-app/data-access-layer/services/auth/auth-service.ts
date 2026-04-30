import "server-only";

import {
  createUserWithCredentials,
  findUserByEmail,
} from "@/data-access-layer/repository";

import { createLogger, hashPassword, LOGGER_CONTEXT } from "@/shared/lib";
import { ConflictError } from "@/shared/lib/errors";

import { mapToAuthUserData } from "./mappers";
import type { SignUpInput, SignUpResult } from "./types";

export class AuthService {
  private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "AuthService" });
  async signUp(input: SignUpInput): Promise<SignUpResult> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      this.logger.warn(
        { userId: "unknown" },
        "Sign up failed: email already exists"
      );
      throw new ConflictError("An account with this email already exists", {
        email: normalizedEmail,
      });
    }
    try {
      const hashedPassword = await hashPassword(input.password);
      const user = await createUserWithCredentials({
        email: normalizedEmail,
        password: hashedPassword,
        name: input.name ?? null,
      });
      return {
        user: mapToAuthUserData({
          id: user.id,
          email: user.email ?? normalizedEmail,
          name: user.name,
        }),
        message: "Account created successfully",
      };
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
        throw new ConflictError("An account with this email already exists", {
          email: normalizedEmail,
        });
      }
      this.logger.error(
        { error, userId: "unknown" },
        "Error creating user account"
      );
      throw error;
    }
  }
}
