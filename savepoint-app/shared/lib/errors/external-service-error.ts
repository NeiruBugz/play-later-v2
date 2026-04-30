import { DomainError } from "./domain-error";

export class ExternalServiceError extends DomainError {
  name = "ExternalServiceError";
}
