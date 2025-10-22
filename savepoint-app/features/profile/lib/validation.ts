import * as filter from "leo-profanity";

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

  // 4. Profanity check (using leo-profanity library)
  if (filter.check(username)) {
    return { valid: false, error: "Username is not allowed" };
  }

  return { valid: true };
};
