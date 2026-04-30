import { DomainError } from "./domain-error";

export class NotFoundError extends DomainError {
  name = "NotFoundError";
}
