export function isSteamPrivacyError(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  return (
    (lower.includes("privacy") || lower.includes("private")) &&
    lower.includes("steam")
  );
}

export function isSteamProfileNotFoundError(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  return (
    (lower.includes("profile") && lower.includes("not found")) ||
    lower.includes("invalid steam id") ||
    (lower.includes("couldn't find") && lower.includes("steam profile"))
  );
}

export function isSteamApiUnavailableError(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  return (
    lower.includes("temporarily unavailable") ||
    (lower.includes("steam") &&
      (lower.includes("unavailable") || lower.includes("try again later")))
  );
}

export function isSteamRateLimitError(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  return (
    lower.includes("too many requests") ||
    lower.includes("rate limit") ||
    (lower.includes("wait") && lower.includes("try again"))
  );
}

export { calculateSmartStatus } from "./calculate-smart-status";
