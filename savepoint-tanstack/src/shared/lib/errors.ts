export type AppErrorCode =
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "UPSTREAM";

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly context?: Record<string, unknown>;

  constructor(
    code: AppErrorCode,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): {
    name: string;
    code: AppErrorCode;
    message: string;
    context?: Record<string, unknown>;
  } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      ...(this.context ? { context: this.context } : {}),
    };
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("NOT_FOUND", message, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("CONFLICT", message, context);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("VALIDATION", message, context);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("UNAUTHORIZED", message, context);
  }
}

export class UpstreamError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("UPSTREAM", message, context);
  }
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
