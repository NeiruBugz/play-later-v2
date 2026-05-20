/**
 * Steam-specific specializations of {@link UpstreamError}.
 *
 * These are NOT new top-level AppError subclasses — the spec methodology
 * caps the AppError catalog at 5 classes. They inherit `code: "UPSTREAM"`
 * but expose distinct `name`s so route `errorComponent`s can branch on
 * `instanceof` for tailored copy (privacy banner, rate-limit toast, etc).
 */
import { UpstreamError } from "@/shared/lib/errors";

export class SteamProfilePrivateError extends UpstreamError {
  constructor(
    message = "Your Steam profile game details are set to private. To import your library, set your game details to public in Steam Privacy Settings.",
    context?: Record<string, unknown>
  ) {
    super(message, context);
    this.name = "SteamProfilePrivateError";
  }
}

export class SteamApiUnavailableError extends UpstreamError {
  constructor(
    message = "Steam is temporarily unavailable. Please try again later.",
    context?: Record<string, unknown>
  ) {
    super(message, context);
    this.name = "SteamApiUnavailableError";
  }
}

export class SteamRateLimitError extends UpstreamError {
  constructor(
    message = "Too many requests to Steam. Please wait a moment and try again.",
    context?: Record<string, unknown>
  ) {
    super(message, context);
    this.name = "SteamRateLimitError";
  }
}

export class SteamProfileNotFoundError extends UpstreamError {
  constructor(
    message = "Steam profile not found.",
    context?: Record<string, unknown>
  ) {
    super(message, context);
    this.name = "SteamProfileNotFoundError";
  }
}
