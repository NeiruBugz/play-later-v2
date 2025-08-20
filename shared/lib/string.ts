export function normalizeString(value: string | null | undefined) {
  if (value === null || value === undefined || value.length === 0) {
    return value;
  }

  if (value.length === 2) {
    return value.toUpperCase();
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}
