const MILLISECONDS_PER_DAY = 86_400_000;
const RELATIVE_ABSOLUTE_THRESHOLD_DAYS = 60;

const JOURNAL_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "2-digit",
  year: "numeric",
};

const ABSOLUTE_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const ABSOLUTE_DATE_FORMATTER = new Intl.DateTimeFormat(
  "en-US",
  ABSOLUTE_DATE_OPTIONS
);

const ABSOLUTE_DATE_UTC_FORMATTER = new Intl.DateTimeFormat("en-US", {
  ...ABSOLUTE_DATE_OPTIONS,
  timeZone: "UTC",
});

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("en-US", {
  numeric: "auto",
});

/**
 * Journal-entry timestamp display (`Jun 02, 2026`).
 * `en-US`, `{ month: "short", day: "2-digit", year: "numeric" }`.
 * Accepts a `Date` or any value the `Date` constructor parses (matching the
 * journal UI's `new Date(value)` coercion).
 */
export function formatJournalDate(date: Date | string | number): string {
  return new Date(date).toLocaleDateString("en-US", JOURNAL_DATE_OPTIONS);
}

/**
 * Absolute date display (`Jun 2, 2026`).
 * `{ year: "numeric", month: "short", day: "numeric" }`.
 *
 * - default (no options): `en-US` locale, local time zone — matches
 *   `Intl.DateTimeFormat("en-US", ...)` callers (game-metadata, lifecycle-strip).
 * - `{ utc: true }`: `en-US`, `timeZone: "UTC"` — matches the date-picker.
 * - `{ locale: undefined }` (explicit): forwards `undefined` to
 *   `toLocaleDateString` so the runtime default locale is used — matches the
 *   Steam import modal's `toLocaleDateString(undefined, ...)`.
 */
export function formatAbsoluteDate(
  date: Date,
  options?: { utc?: boolean; locale?: undefined }
): string {
  if (options && "locale" in options) {
    return date.toLocaleDateString(undefined, ABSOLUTE_DATE_OPTIONS);
  }
  if (options?.utc) {
    return ABSOLUTE_DATE_UTC_FORMATTER.format(date);
  }
  return ABSOLUTE_DATE_FORMATTER.format(date);
}

/**
 * Bare locale date (`6/2/2026`) using the runtime default locale and no
 * options — matches `value.toLocaleDateString()` (profile activity feed).
 */
export function formatLocaleDate(date: Date): string {
  return date.toLocaleDateString();
}

/**
 * Relative-time display (`yesterday`, `in 3 days`) for dates within
 * ±60 days of `now`; beyond that, falls back to the absolute `en-US` date.
 * Mirrors profile-overview's prior behavior byte-for-byte.
 */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffDays = Math.round(
    (now.getTime() - date.getTime()) / MILLISECONDS_PER_DAY
  );

  if (Math.abs(diffDays) > RELATIVE_ABSOLUTE_THRESHOLD_DAYS) {
    return ABSOLUTE_DATE_FORMATTER.format(date);
  }

  return RELATIVE_TIME_FORMATTER.format(-diffDays, "day");
}

/**
 * Human-readable playtime for a positive minute count: `6h 30m`, `45m`, `6h`.
 * Callers own the zero/empty case — different surfaces want different copy
 * (`—` on the game-detail rail, `Never played` on the steam-import card) — so
 * this helper assumes `totalMinutes > 0`.
 */
export function formatPlaytimeMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
