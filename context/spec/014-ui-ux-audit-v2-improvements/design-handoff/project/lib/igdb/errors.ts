export class IgdbError extends Error {
  readonly status?: number;
  readonly cause?: unknown;
  readonly attempt?: number;

  constructor(
    message: string,
    options?: { status?: number; cause?: unknown; attempt?: number }
  ) {
    super(message);
    this.name = "IgdbError";
    this.status = options?.status;
    this.cause = options?.cause;
    this.attempt = options?.attempt;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class IgdbAuthError extends IgdbError {
  constructor(
    message: string,
    options?: { status?: number; cause?: unknown; attempt?: number }
  ) {
    super(message, options);
    this.name = "IgdbAuthError";
  }
}

export class IgdbRateLimitError extends IgdbError {
  readonly retryAfterMs?: number;

  constructor(
    message: string,
    options?: {
      status?: number;
      cause?: unknown;
      attempt?: number;
      retryAfterMs?: number;
    }
  ) {
    super(message, options);
    this.name = "IgdbRateLimitError";
    this.retryAfterMs = options?.retryAfterMs;
  }
}

export class IgdbServerError extends IgdbError {
  constructor(
    message: string,
    options?: { status?: number; cause?: unknown; attempt?: number }
  ) {
    super(message, options);
    this.name = "IgdbServerError";
  }
}

export class IgdbNetworkError extends IgdbError {
  constructor(
    message: string,
    options?: { status?: number; cause?: unknown; attempt?: number }
  ) {
    super(message, options);
    this.name = "IgdbNetworkError";
  }
}

export class IgdbHttpError extends IgdbError {
  constructor(
    message: string,
    options?: { status?: number; cause?: unknown; attempt?: number }
  ) {
    super(message, options);
    this.name = "IgdbHttpError";
  }
}
