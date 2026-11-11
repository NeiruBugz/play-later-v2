export const EVENING_MINUTES_CHOICES = [60, 90, 105, 120, 150, 180] as const;

export const DEFAULT_EVENING_MINUTES = 105;

const SECONDS_PER_MINUTE = 60;

export function formatEvenings(
  seconds: number | null,
  eveningMinutes: number
): string | null {
  if (seconds === null) {
    return null;
  }
  const eveningSeconds = eveningMinutes * SECONDS_PER_MINUTE;
  const evenings = Math.max(
    1,
    Math.floor((2 * seconds + eveningSeconds) / (2 * eveningSeconds))
  );
  return evenings === 1 ? "One evening" : `About ${evenings} evenings`;
}
