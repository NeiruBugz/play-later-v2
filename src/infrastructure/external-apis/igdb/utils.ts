export const asError = (thrown: unknown): Error => {
  if (thrown instanceof Error) return thrown;
  try {
    return new Error(JSON.stringify(thrown));
  } catch {
    return new Error(String(thrown));
  }
};

export const getTimeStamp = (): number => Math.floor(Date.now() / 1000);

export function normalizeString(input: string): string {
  return input
    .toLowerCase()
    .replace(/[:\-]/g, "")
    .replace(/\bthe\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTitle(input: string): string {
  const specialCharsRegex =
    /[\u2122\u00A9\u00AE\u0024\u20AC\u00A3\u00A5\u2022\u2026]/g;
  return input.replace(specialCharsRegex, "").toLowerCase().trim();
}
