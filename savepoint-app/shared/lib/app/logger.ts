import pino, { type LogFn, type LoggerOptions } from "pino";

const isBrowser = typeof window !== "undefined";
const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
const redactPaths: string[] = [
  "req.headers.authorization",
  "req.headers.cookie",
  "user.password",
  "user.token",
  "authorization",
  "password",
  "token",
  "secrets",
  "apiKey",
  "credentials",
];
const SECRET_KEYS = [
  "password",
  "pass",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "secret",
  "apiKey",
  "clientSecret",
];
const SAFE_EXTRA_KEYS = [
  "code",
  "status",
  "statusCode",
  "path",
  "reason",
  "details",
];

export const logger = pino(createLoggerOptions());

export const createLogger = (bindings: Record<string, unknown>) => {
  return logger.child(bindings);
};

export type Logger = typeof logger;

function createLoggerOptions(): LoggerOptions {
  const level =
    (isTest ? "silent" : process.env.LOG_LEVEL) ||
    (isDevelopment ? "debug" : "info");

  const options: LoggerOptions = {
    level,
    enabled: !isTest,
    redact: {
      paths: redactPaths,
      censor: "[REDACTED]",
    },
    formatters: {
      level: (label) => ({ level: label }),
    },
    base: {
      env: process.env.NODE_ENV,
    },
    hooks: {
      logMethod(args: unknown[], method: LogFn) {
        const normalizedArgs = normalizeLogArgs(args);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        method.apply(this, normalizedArgs as any);
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

function normalizeLogArgs(args: unknown[]) {
  if (args.length === 0) {
    return args;
  }

  const argsWithErrorFirst =
    typeof args[0] === "string" && args[1] instanceof Error
      ? [{ err: args[1] }, args[0], ...args.slice(2)]
      : args;

  const normalizedArgs = argsWithErrorFirst.map((value, index) => {
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

  return normalizedArgs;
}

function serializeError(error: Error): Record<string, unknown> {
  const out: Record<string, unknown> = {
    type: error.name,
    message: error.message,
  };
  if ((error as Error).stack) out.stack = (error as Error).stack;

  const src = error as unknown as Record<string, unknown>;
  for (const key of Object.keys(src)) {
    if (key === "name" || key === "message" || key === "stack") continue;
    const lower = key.toLowerCase();
    if (SECRET_KEYS.some((s) => lower.includes(s))) {
      out[key] = "[REDACTED]";
      continue;
    }
    if (SAFE_EXTRA_KEYS.includes(key)) {
      const v = src[key];
      out[key] = isRecord(v) ? JSON.stringify(v) : v;
      continue;
    }
    const v = src[key];
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      out[key] = v;
    }
  }

  const cause = (error as unknown as { cause?: unknown }).cause;
  if (cause !== undefined) {
    out.cause = cause instanceof Error ? serializeError(cause) : cause;
  }
  return out;
}

function browserIsoTime() {
  return new Date().toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
