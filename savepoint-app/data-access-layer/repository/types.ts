export enum RepositoryErrorCode {
  NOT_FOUND = "NOT_FOUND",
  DUPLICATE = "DUPLICATE",
  INVALID_INPUT = "INVALID_INPUT",
  DATABASE_ERROR = "DATABASE_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  ALREADY_EXISTS = "ALREADY_EXISTS",
}
export type RepositoryError = {
  code: RepositoryErrorCode;
  message: string;
  details?: unknown;
};
export type RepositorySuccess<TData> = {
  ok: true;
  data: TData;
};
export type RepositoryFailure = {
  ok: false;
  error: RepositoryError;
};
export type RepositoryResult<TData> =
  | RepositorySuccess<TData>
  | RepositoryFailure;
export function repositorySuccess<TData>(data: TData): RepositoryResult<TData> {
  return {
    ok: true,
    data,
  };
}
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
export function isRepositorySuccess<TData>(
  result: RepositoryResult<TData>
): result is RepositorySuccess<TData> {
  return result.ok === true;
}
export function isRepositoryError<TData>(
  result: RepositoryResult<TData>
): result is RepositoryFailure {
  return result.ok === false;
}
