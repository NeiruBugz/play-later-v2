import { DomainError } from "./domain-error";

export class RateLimitError extends DomainError {
  name = "RateLimitError";
}
