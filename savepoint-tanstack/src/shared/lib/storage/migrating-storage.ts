export function readMigratingItem(
  key: string,
  legacyKey: string
): string | null {
  try {
    const current = window.localStorage.getItem(key);
    if (current !== null) return current;
    const legacy = window.localStorage.getItem(legacyKey);
    if (legacy === null) return null;
    window.localStorage.setItem(key, legacy);
    window.localStorage.removeItem(legacyKey);
    return legacy;
  } catch {
    return null;
  }
}

export function writeMigratingItem(
  key: string,
  legacyKey: string,
  value: string
): void {
  try {
    window.localStorage.setItem(key, value);
    window.localStorage.removeItem(legacyKey);
  } catch {
    // Storage unavailable (private mode / blocked); the preference stays in-memory.
  }
}
