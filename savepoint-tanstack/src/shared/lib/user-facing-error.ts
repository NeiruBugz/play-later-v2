import type { AppErrorCode } from "./errors";

export const SAVE_FAILED_MESSAGE = "Couldn't save. Try again.";

const MESSAGES_BY_APP_ERROR_CODE: Record<AppErrorCode, string> = {
  NOT_FOUND: "That game isn't in your library anymore.",
  CONFLICT: SAVE_FAILED_MESSAGE,
  VALIDATION: "Check what you entered and try again.",
  UNAUTHORIZED: "Sign in again to continue.",
  UPSTREAM: SAVE_FAILED_MESSAGE,
};

const MESSAGES_BY_SPECIFIC_CODE: Record<string, string> = {
  RATE_LIMITED: "Too many searches. Wait a moment and try again.",
  UP_NEXT_FULL: "Up Next holds 5 games. Remove one to add this.",
  TIME_NEEDS_GAME: "Choose a game to log time.",
  UNDO_ADD_UNAVAILABLE:
    "This game can't be undone anymore. Remove it from your library instead.",
};

function readString(source: unknown, key: string): string | undefined {
  if (typeof source !== "object" || source === null) return undefined;
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

export function getUserFacingErrorMessage(error: unknown): string {
  const specificCode = readString(
    (error as { context?: unknown } | null)?.context,
    "code"
  );
  if (specificCode && Object.hasOwn(MESSAGES_BY_SPECIFIC_CODE, specificCode)) {
    return MESSAGES_BY_SPECIFIC_CODE[specificCode] as string;
  }

  const code = readString(error, "code");
  if (code && Object.hasOwn(MESSAGES_BY_APP_ERROR_CODE, code)) {
    return MESSAGES_BY_APP_ERROR_CODE[code as AppErrorCode];
  }

  return SAVE_FAILED_MESSAGE;
}
