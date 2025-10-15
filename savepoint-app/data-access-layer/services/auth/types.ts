/**
 * AuthService Types
 *
 * Type definitions for the auth service layer.
 * Input validation is handled at the server action layer via Zod.
 * These types focus on service layer inputs and outputs.
 *
 * @module data-access-layer/services/auth/types
 */

import type { ServiceResult } from "../types";

// ============================================================================
// Input Types
// ============================================================================

/**
 * Input for user sign up.
 */
export type SignUpInput = {
  email: string;
  password: string;
  name?: string;
};

/**
 * Input for user sign in.
 */
export type SignInInput = {
  email: string;
  password: string;
};

// ============================================================================
// Output Types
// ============================================================================

/**
 * User data returned after authentication.
 */
export type AuthUserData = {
  id: string;
  email: string;
  name: string | null;
};

/**
 * Result type for sign up.
 */
export type SignUpResult = ServiceResult<{
  user: AuthUserData;
  message: string;
}>;

/**
 * Result type for sign in.
 */
export type SignInResult = ServiceResult<{
  user: AuthUserData;
  message: string;
}>;
