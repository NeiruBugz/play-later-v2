export function capitalizeString(value: string | null | undefined) {
  if (value === null || value === undefined || value.length === 0) {
    return value;
  }
  if (value.length === 2) {
    return value.toUpperCase();
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
export function normalizeString(input: string): string {
  return input
    .toLowerCase()
    .replace(/[:-]/g, "")
    .replace(/\bthe\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
export function normalizeGameTitle(input: string): string {
  const specialCharsRegex =
    /[\u2122\u00A9\u00AE\u0024\u20AC\u00A3\u00A5\u2022\u2026]/g;
  return input.replace(specialCharsRegex, "").toLowerCase().trim();
}
