export function normalizeString(value: string | null) {
  if (!value || value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
