import { getErrorMessage } from "@/shared/lib/errors";

const FALLBACK_MESSAGE = "Something went wrong";
const INVALID_ENTRY_MESSAGE = "Add a thought or the time you played.";

export function getSaveErrorMessage(error: unknown): string {
  const message = getErrorMessage(error, FALLBACK_MESSAGE);
  const looksLikeRawValidationOutput = /^\s*[[{]/.test(message);
  return looksLikeRawValidationOutput ? INVALID_ENTRY_MESSAGE : message;
}
