import { DomainError } from "./domain-error";

export class ConflictError extends DomainError {
  name = "ConflictError";
}
