/**
 * NextAuth Error Handling Utilities
 *
 * NextAuth v5 throws a special "NEXT_REDIRECT" error on successful authentication
 * to trigger Next.js server-side redirects. This utility provides type-safe helpers
 * to distinguish between redirect errors and actual authentication failures.
 */

/**
 * Checks if an error is a NextAuth redirect (successful authentication).
 * NextAuth throws errors with message "NEXT_REDIRECT" to trigger redirects.
 *
 * @param error - The error to check
 * @returns true if this is a redirect error (successful auth)
 */
export function isNextAuthRedirect(error: unknown): boolean {
  return error instanceof Error && error.message === "NEXT_REDIRECT";
}

/**
 * Checks if an error is an actual authentication failure (not a redirect).
 *
 * @param error - The error to check
 * @returns true if this is a real auth error (failed auth)
 */
export function isAuthenticationError(error: unknown): boolean {
  return error instanceof Error && error.message !== "NEXT_REDIRECT";
}
