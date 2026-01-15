export enum RepositoryErrorCode {
  NOT_FOUND = "NOT_FOUND",
  DUPLICATE = "DUPLICATE",
  INVALID_INPUT = "INVALID_INPUT",
  DATABASE_ERROR = "DATABASE_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
}
export type RepositoryError = {
  code: RepositoryErrorCode;
  message: string;
  details?: unknown;
};
export type RepositorySuccess<TData> = {
  success: true;
  data: TData;
};
export type RepositoryFailure = {
  success: false;
  error: RepositoryError;
};
export type RepositoryResult<TData> =
  | RepositorySuccess<TData>
  | RepositoryFailure;
export function repositorySuccess<TData>(data: TData): RepositoryResult<TData> {
  return {
    success: true,
    data,
  };
}
export function repositoryError<TData = never>(
  code: RepositoryErrorCode,
  message: string,
  details?: unknown
): RepositoryResult<TData> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}
export function isRepositorySuccess<TData>(
  result: RepositoryResult<TData>
): result is RepositorySuccess<TData> {
  return result.success === true;
}
export function isRepositoryError<TData>(
  result: RepositoryResult<TData>
): result is RepositoryFailure {
  return result.success === false;
}

export async function withRepositoryError<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<RepositoryResult<T>> {
  try {
    const result = await operation();
    return repositorySuccess(result);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `${errorMessage}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
