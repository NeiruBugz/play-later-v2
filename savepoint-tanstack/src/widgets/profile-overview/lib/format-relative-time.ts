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
