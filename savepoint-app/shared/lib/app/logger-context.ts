/**
 * Standardized logger context keys for consistent structured logging.
 *
 * Use these constants to create loggers with consistent context across the application.
 * This enables better log aggregation, filtering, and searchability in production.
 *
 * @example
 * // Service
 * const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "GameService" });
 *
 * // Server Action
 * const logger = createLogger({ [LOGGER_CONTEXT.SERVER_ACTION]: "addGameAction" });
 *
 * // Page
 * const logger = createLogger({ [LOGGER_CONTEXT.PAGE]: "ProfilePage" });
 */
export const LOGGER_CONTEXT = {
  /** Services in data-access-layer/services */
  SERVICE: "service",
  /** Server actions in features/server-actions */
  SERVER_ACTION: "serverAction",
  /** Next.js pages in app */
  PAGE: "page",
  /** React error boundary components */
  ERROR_BOUNDARY: "errorBoundary",
  /** Storage utilities (S3, etc.) */
  STORAGE: "storage",
} as const;

export type LoggerContextKey =
  (typeof LOGGER_CONTEXT)[keyof typeof LOGGER_CONTEXT];
