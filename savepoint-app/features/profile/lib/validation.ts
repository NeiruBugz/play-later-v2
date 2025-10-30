import * as filter from "leo-profanity";

// Extend leo-profanity with a minimal set our product requires
// that is missing from the default dictionary.
// Keep this list small and maintained via the library API (not custom scanning).
const ADDITIONAL_PROFANITY = ["damn"] as const;
filter.add(ADDITIONAL_PROFANITY as unknown as string[]);

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

const RESERVED_USERNAMES = ["admin", "support", "savepoint", "moderator"];

/**
 * Validates username according to the following rules:
 * - Length: 3-25 characters
 * - Characters: Letters (a-z, A-Z), numbers (0-9), and special symbols (_, -, .)
 * - Not reserved: admin, support, savepoint, moderator (case-insensitive)
 * - Not profane: Uses leo-profanity library to filter offensive usernames
 *
 * @param username - The username to validate
 * @returns ValidationResult indicating whether the username is valid
 */
export const validateUsername = (username: string): ValidationResult => {
  // 1. Length check (3-25 chars)
  if (username.length < 3 || username.length > 25) {
    return { valid: false, error: "Username must be 3-25 characters" };
  }

  // 2. Character check (alphanumeric + _-.)
  const validChars = /^[a-zA-Z0-9_\-\.]+$/;
  if (!validChars.test(username)) {
    return {
      valid: false,
      error: "Username can only contain letters, numbers, _, -, and .",
    };
  }

  // 3. Reserved names check (case-insensitive)
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return { valid: false, error: "Username is not allowed" };
  }

  // 4. Profanity check (leo-profanity) with concatenation handling
  // a) Direct check handles cases split by separators already
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

  // c) Conservative substring scan on a compact form to catch concatenations
  //    Use only dictionary words with length >= 4 to avoid false positives
  //    like "class" containing "ass" (len 3).
  const compact = lower.replace(/[^a-z0-9]/g, "");
  const profaneWords = filter
    .list()
    .filter((w) => /^[a-z]+$/.test(w) && w.length >= 4);
  for (const w of profaneWords) {
    if (compact.startsWith(w) || compact.endsWith(w)) {
      return { valid: false, error: "Username is not allowed" };
    }
  }

  return { valid: true };
};
