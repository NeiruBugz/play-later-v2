import { RateLimitError } from "@/shared/lib/errors";

export class IgdbRateLimitError extends RateLimitError {
  readonly name = "IgdbRateLimitError";
}
