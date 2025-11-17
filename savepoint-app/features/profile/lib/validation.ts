import * as filter from "leo-profanity";
import {
  PROFANITY_MIN_WORD_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/shared/constants";

const ADDITIONAL_PROFANITY = ["damn"] as const;
filter.add(ADDITIONAL_PROFANITY as unknown as string[]);
export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };
const RESERVED_USERNAMES = ["admin", "support", "savepoint", "moderator"];
export const validateUsername = (username: string): ValidationResult => {
  if (
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH
  ) {
    return {
      valid: false,
      error: `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters`,
    };
  }
  const validChars = /^[a-zA-Z0-9_\-\.]+$/;
  if (!validChars.test(username)) {
    return {
      valid: false,
      error: "Username can only contain letters, numbers, _, -, and .",
    };
  }
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return { valid: false, error: "Username is not allowed" };
  }
  if (filter.check(username)) {
    return { valid: false, error: "Username is not allowed" };
  }
  // b) Token check with camelCase splitting (e.g., "damnUser" -> "damn user")
  const camelSplit = username.replace(/([a-z])([A-Z])/g, "$1 $2");
  const lower = camelSplit.toLowerCase();
  const tokens = lower.match(/[a-z]+/g) ?? [];
  const dictSet = new Set(filter.list());
  for (const token of tokens) {
    if (dictSet.has(token)) {
      return { valid: false, error: "Username is not allowed" };
    }
  }
  //    like "class" containing "ass" (len 3).
  const compact = lower.replace(/[^a-z0-9]/g, "");
  const profaneWords = filter
    .list()
    .filter((w) => /^[a-z]+$/.test(w) && w.length >= PROFANITY_MIN_WORD_LENGTH);
  for (const w of profaneWords) {
    if (compact.startsWith(w) || compact.endsWith(w)) {
      return { valid: false, error: "Username is not allowed" };
    }
  }
  return { valid: true };
};
