import "server-only";

import { createLogger, hashPassword, prisma } from "@/shared/lib";

import { BaseService, ServiceErrorCode } from "../types";
import type {
  SignInInput,
  SignInResult,
  SignUpInput,
  SignUpResult,
} from "./types";

export class AuthService extends BaseService {
  private logger = createLogger({ service: "AuthService" });

  async signUp(input: SignUpInput): Promise<SignUpResult> {
    try {
      this.logger.info({ email: input.email }, "User sign up attempt");

      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        this.logger.warn(
          { email: input.email },
          "Sign up failed: email already exists"
        );
        return this.error(
          "An account with this email already exists",
          ServiceErrorCode.CONFLICT
        );
      }

      const hashedPassword = await hashPassword(input.password);

      const user = await prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name ?? null,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      this.logger.info(
        { userId: user.id, email: user.email },
        "User account created successfully"
      );

      return this.success({
        user: {
          id: user.id,
          email: user.email!,
          name: user.name,
        },
        message: "Account created successfully",
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("Unique constraint") ||
          error.message.includes("unique"))
      ) {
        this.logger.warn(
          { email: input.email, error },
          "Sign up failed: unique constraint violation"
        );
        return this.error(
          "An account with this email already exists",
          ServiceErrorCode.CONFLICT
        );
      }

      this.logger.error(
        { error, email: input.email },
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
