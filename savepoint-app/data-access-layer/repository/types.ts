/**
 * Repository Layer Types
 *
 * Shared types for repository layer error handling and return types.
 * Repositories return RepositoryResult<TData> for consistent error handling.
 */

/**
 * Standard error codes for repository operations
 */
export enum RepositoryErrorCode {
  /** Resource not found in database */
  NOT_FOUND = "NOT_FOUND",

  /** Unique constraint violation or duplicate resource */
  DUPLICATE = "DUPLICATE",

  /** Invalid input parameters */
  INVALID_INPUT = "INVALID_INPUT",

  /** Database query or connection error */
  DATABASE_ERROR = "DATABASE_ERROR",

  /** Unexpected internal error */
  INTERNAL_ERROR = "INTERNAL_ERROR",

  ALREADY_EXISTS = "ALREADY_EXISTS",
}

/**
 * Repository error object structure
 */
export type RepositoryError = {
  code: RepositoryErrorCode;
  message: string;
  details?: unknown;
};

/**
 * Successful repository result
 */
export type RepositorySuccess<TData> = {
  ok: true;
  data: TData;
};

/**
 * Failed repository result
 */
export type RepositoryFailure = {
  ok: false;
  error: RepositoryError;
};

/**
 * Result type for repository operations
 * Similar to ServiceResult but uses 'ok' instead of 'success' for consistency with existing code
 */
export type RepositoryResult<TData> =
  | RepositorySuccess<TData>
  | RepositoryFailure;

/**
 * Helper to create a successful repository result
 */
export function repositorySuccess<TData>(data: TData): RepositoryResult<TData> {
  return {
    ok: true,
    data,
  };
}

/**
 * Helper to create an error repository result
 */
export function repositoryError<TData = never>(
  code: RepositoryErrorCode,
  message: string,
  details?: unknown
): RepositoryResult<TData> {
  return {
    ok: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Type guard to check if a repository result is successful
 */
export function isRepositorySuccess<TData>(
  result: RepositoryResult<TData>
): result is RepositorySuccess<TData> {
  return result.ok === true;
}

/**
 * Type guard to check if a repository result is an error
 */
export function isRepositoryError<TData>(
  result: RepositoryResult<TData>
): result is RepositoryFailure {
  return result.ok === false;
}
