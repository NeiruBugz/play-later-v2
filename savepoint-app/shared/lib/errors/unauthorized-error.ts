import { DomainError } from "./domain-error";

export class UnauthorizedError extends DomainError {
  name = "UnauthorizedError";
}
