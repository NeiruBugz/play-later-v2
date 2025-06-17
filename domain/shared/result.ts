export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  readonly value: T;
  readonly isSuccess = true;
  readonly isFailure = false;

  constructor(value: T) {
    this.value = value;
  }
}

export class Failure<E> {
  readonly error: E;
  readonly isSuccess = false;
  readonly isFailure = true;

  constructor(error: E) {
    this.error = error;
  }
}

export const success = <T>(value: T): Success<T> => new Success(value);
export const failure = <E>(error: E): Failure<E> => new Failure(error);

// Helper to automatically wrap async functions in try/catch with Result pattern
export const wrapWithResult = <T>(
  fn: () => Promise<T>,
  errorMsg: string
): Promise<Result<T>> => {
  return fn()
    .then((value) => success(value))
    .catch((error) => {
      console.error(`${errorMsg}:`, error);
      return failure(error);
    });
};
