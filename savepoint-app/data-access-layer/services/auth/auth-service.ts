/**
 * AuthService - Business logic layer for authentication operations
 *
 * This service handles all business logic for user authentication.
 * Input validation is handled at the server action layer via Zod.
 * This service focuses on:
 * - User registration
 * - Password hashing and verification
 * - Business rule enforcement (e.g., email uniqueness)
 * - Error handling
 *
 * @module data-access-layer/services/auth/auth-service
 */

import "server-only";

import { prisma } from "@/shared/lib/db";
import { hashPassword } from "@/shared/lib/password";

import { BaseService, ServiceErrorCode } from "../types";
import type {
  SignInInput,
  SignInResult,
  SignUpInput,
  SignUpResult,
} from "./types";

/**
 * AuthService class
 *
 * Provides business logic operations for user authentication.
 * All methods return ServiceResult discriminated unions for type-safe error handling.
 *
 * @example
 * ```typescript
 * const service = new AuthService();
 *
 * // Sign up a new user
 * const result = await service.signUp({
 *   email: "user@example.com",
 *   password: "securepassword123",
 *   name: "John Doe"
 * });
 *
 * if (result.success) {
 *   console.log(result.data.user); // TypeScript knows user exists
 *   console.log(result.data.message);
 * } else {
 *   console.error(result.error); // TypeScript knows error exists
 * }
 * ```
 */
export class AuthService extends BaseService {
  /**
   * Register a new user with email and password.
   *
   * Business rules:
   * - Email must be unique
   * - Password is hashed using bcrypt before storage
   * - Name is optional
   *
   * @param input - Sign up parameters
   * @returns ServiceResult with user data
   *
   * @example
   * ```typescript
   * const result = await service.signUp({
   *   email: "user@example.com",
   *   password: "securepassword123",
   *   name: "John Doe"
   * });
   *
   * if (result.success) {
   *   console.log(result.data.user.id);
   *   console.log(result.data.user.email);
   *   console.log(result.data.message);
   * }
   * ```
   */
  async signUp(input: SignUpInput): Promise<SignUpResult> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        return this.error(
          "An account with this email already exists",
          ServiceErrorCode.CONFLICT
        );
      }

      // Hash the password
      const hashedPassword = await hashPassword(input.password);

      // Create the user
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

      return this.success({
        user: {
          id: user.id,
          email: user.email!,
          name: user.name,
        },
        message: "Account created successfully",
      });
    } catch (error) {
      // Check for unique constraint violation
      if (
        error instanceof Error &&
        (error.message.includes("Unique constraint") ||
          error.message.includes("unique"))
      ) {
        return this.error(
          "An account with this email already exists",
          ServiceErrorCode.CONFLICT
        );
      }

      return this.handleError(error, "Failed to create account");
    }
  }

  /**
   * Verify user credentials for sign in.
   *
   * Note: This method only validates credentials. Actual session creation
   * is handled by NextAuth after successful verification.
   *
   * @param _input - Sign in parameters (unused - kept for interface consistency)
   * @returns ServiceResult with user data if credentials are valid
   *
   * @example
   * ```typescript
   * const result = await service.signIn({
   *   email: "user@example.com",
   *   password: "securepassword123"
   * });
   *
   * if (result.success) {
   *   console.log(result.data.user);
   *   // Proceed with NextAuth session creation
   * } else {
   *   console.error(result.error.message);
   * }
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async signIn(_input: SignInInput): Promise<SignInResult> {
    try {
      // Note: Password verification is handled by NextAuth's authorize function
      // This method is kept for potential future use or direct API access
      return this.error(
        "Sign in should be handled through NextAuth",
        ServiceErrorCode.VALIDATION_ERROR
      );
    } catch (error) {
      return this.handleError(error, "Failed to sign in");
    }
  }
}
