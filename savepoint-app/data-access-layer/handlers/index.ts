/**
 * Handlers Layer - Request orchestration for API routes and server actions
 *
 * Handlers coordinate requests by:
 * - Validating inputs
 * - Applying rate limiting
 * - Calling appropriate services/use-cases
 * - Formatting responses
 *
 * ⚠️ ESLint boundaries enforce that only API routes can import handlers
 */

export * from "./types";
export * from "./game-search/game-search-handler";
