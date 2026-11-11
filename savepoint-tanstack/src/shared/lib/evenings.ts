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

export const MIN_EVENING_MINUTES = 30;

export const MAX_EVENING_MINUTES = 360;

const MINUTES_PER_HOUR = 60;

export type EveningLengthUnit = "minutes" | "hours";

export function parseEveningLengthInput(
  value: string,
  unit: EveningLengthUnit
): number | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount)) {
    return null;
  }
  const minutes = Math.round(
    unit === "hours" ? amount * MINUTES_PER_HOUR : amount
  );
  return minutes >= MIN_EVENING_MINUTES && minutes <= MAX_EVENING_MINUTES
    ? minutes
    : null;
}

export function formatEveningLengthInput(minutes: number): {
  value: string;
  unit: EveningLengthUnit;
} {
  return minutes % MINUTES_PER_HOUR === 0
    ? { value: String(minutes / MINUTES_PER_HOUR), unit: "hours" }
    : { value: String(minutes), unit: "minutes" };
}
