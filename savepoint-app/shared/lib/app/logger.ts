import pino from "pino";

/**
 * Production-grade logger using Pino
 *
 * Features:
 * - JSON structured logging in production
 * - Pretty-printed logs in development
 * - Automatic log levels based on environment
 * - Request ID tracking support
 * - Performance optimized (5-10x faster than Winston)
 */

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  // In test environment, disable logging to reduce noise
  ...(isTest && { level: "silent" }),
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
          singleLine: false,
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  base: {
    env: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create a child logger with additional context
 *
 * @example
 * const serviceLogger = createLogger({ service: 'GameService' });
 * serviceLogger.info('Game searched', { query: 'zelda' });
 */
export const createLogger = (bindings: Record<string, unknown>) => {
  return logger.child(bindings);
};

/**
 * Log levels (in order of severity):
 * - fatal: System-level failures, application crash
 * - error: Errors that need attention but application continues
 * - warn: Warning messages, recoverable issues
 * - info: Key application events (user actions, major operations)
 * - debug: Detailed debugging information
 * - trace: Very detailed debugging (function entry/exit)
 */

// Export type for usage in services
export type Logger = typeof logger;
