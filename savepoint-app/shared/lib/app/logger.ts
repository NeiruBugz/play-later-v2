import pino, { type LogFn, type LoggerOptions } from "pino";

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

const isBrowser = typeof window !== "undefined";
const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

export const logger = pino(createLoggerOptions());

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

function createLoggerOptions(): LoggerOptions {
  const level =
    (isTest ? "silent" : process.env.LOG_LEVEL) ||
    (isDevelopment ? "debug" : "info");

  const options: LoggerOptions = {
    level,
    formatters: {
      level: (label) => ({ level: label }),
    },
    base: {
      env: process.env.NODE_ENV,
    },
    hooks: {
      // Normalize errors so server and browser logs share the same shape.
      logMethod(args, method) {
        method.apply(this, normalizeLogArgs(args));
      },
    },
  };

  if (isBrowser) {
    options.browser = {
      asObject: true,
    };
    options.timestamp = browserIsoTime;
  } else {
    options.timestamp = pino.stdTimeFunctions.isoTime;
    if (isDevelopment) {
      options.transport = {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
          singleLine: false,
        },
      };
    }
  }

  return options;
}

function normalizeLogArgs(args: Parameters<LogFn>) {
  if (args.length === 0) {
    return args;
  }

  const normalizedArgs = args.map((value, index) => {
    if (value instanceof Error) {
      return index === 0
        ? { err: serializeError(value) }
        : serializeError(value);
    }

    if (isRecord(value)) {
      const maybeError = value.err;
      if (maybeError instanceof Error) {
        return {
          ...value,
          err: serializeError(maybeError),
        };
      }
    }

    return value;
  });

  return normalizedArgs as Parameters<LogFn>;
}

function serializeError(error: Error) {
  const serialized: Record<string, unknown> = {
    type: error.name,
    message: error.message,
  };

  if (error.stack) {
    serialized.stack = error.stack;
  }

  const errorWithProps = error as unknown as Record<string, unknown>;
  for (const key of Object.keys(errorWithProps)) {
    if (key === "name" || key === "message" || key === "stack") {
      continue;
    }

    serialized[key] = errorWithProps[key];
  }

  if ("cause" in error && error.cause !== undefined) {
    serialized.cause =
      error.cause instanceof Error ? serializeError(error.cause) : error.cause;
  }

  return serialized;
}

function browserIsoTime() {
  return new Date().toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
