import type { ImportFailureCode } from "@/entities/import-job";

const GENERIC_FAILURE_MESSAGE = "Steam sync failed. Please try again.";

const FAILURE_MESSAGES: Record<ImportFailureCode, string> = {
  PROFILE_PRIVATE:
    "We couldn't see any games on your Steam account. If you own games, open Steam → Privacy Settings, set 'Game details' to Public, and untick 'Always keep my total playtime private'. Steam can take a few minutes to apply the change — then sync again.",
  STEAM_UNAVAILABLE:
    "Steam is temporarily unavailable. Please try again later.",
  RATE_LIMITED:
    "Too many requests to Steam. Please wait a moment and try again.",
  STALLED: "Steam sync stopped unexpectedly. Please sync again.",
  START_FAILED: "Steam sync couldn't start. Please try again.",
  UNKNOWN: GENERIC_FAILURE_MESSAGE,
};

export const syncFailureMessage = (code: ImportFailureCode | null): string =>
  code === null ? GENERIC_FAILURE_MESSAGE : FAILURE_MESSAGES[code];
