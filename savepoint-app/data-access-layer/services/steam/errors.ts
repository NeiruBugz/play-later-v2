import { ExternalServiceError } from "@/shared/lib/errors";

export class SteamProfilePrivateError extends ExternalServiceError {
  readonly name = "SteamProfilePrivateError";
}

export class SteamApiUnavailableError extends ExternalServiceError {
  readonly name = "SteamApiUnavailableError";
}
