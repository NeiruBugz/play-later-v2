export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class DuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateError";
  }
}

export const RepositoryErrorCode = {
  NOT_FOUND: "NOT_FOUND",
  DUPLICATE: "DUPLICATE",
  UNKNOWN: "UNKNOWN",
} as const;

export type RepositoryErrorCode =
  (typeof RepositoryErrorCode)[keyof typeof RepositoryErrorCode];

export type RepositoryError = {
  code: RepositoryErrorCode;
  message: string;
};

export type RepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: RepositoryError };

export function repositorySuccess<T>(data: T): RepositoryResult<T> {
  return { ok: true, data };
}

export function repositoryError<T = never>(
  code: RepositoryErrorCode,
  message: string
): RepositoryResult<T> {
  return { ok: false, error: { code, message } };
}
