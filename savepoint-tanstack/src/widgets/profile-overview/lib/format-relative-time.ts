/**
 * Minimal relative-time formatter for the "Recently Played" overlay
 * (e.g., "11 days ago", "yesterday", "in 2 months"). Uses the built-in
 * `Intl.RelativeTimeFormat` so we avoid pulling in `date-fns` / `dayjs`
 * for a single consumer (see DIVERGENCES.md slice 15 — date-fns is
 * intentionally not yet a dependency).
 *
 * Falls back to an absolute short date once the delta exceeds ~60 days,
 * matching canonical's `formatRelativeDate` from
 * `savepoint-app/shared/lib/date.ts`.
 */
const MILLISECONDS_PER_DAY = 86_400_000;
const ABSOLUTE_THRESHOLD_DAYS = 60;

export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffDays = Math.round(
    (now.getTime() - date.getTime()) / MILLISECONDS_PER_DAY
  );

  if (Math.abs(diffDays) > ABSOLUTE_THRESHOLD_DAYS) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }

  return new Intl.RelativeTimeFormat("en-US", { numeric: "auto" }).format(
    -diffDays,
    "day"
  );
}
