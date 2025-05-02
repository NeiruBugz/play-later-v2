export class DomainError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string | number, cause?: unknown) {
    super(`${entity} with id ${id} not found`, cause);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export class AuthenticationError extends DomainError {
  constructor(message = "User not authenticated", cause?: unknown) {
    super(message, cause);
  }
}

export class DatabaseError extends DomainError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}
