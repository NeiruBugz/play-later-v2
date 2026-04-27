import {
  MILLISECONDS_PER_DAY,
  RELATIVE_DATE_THRESHOLD_DAYS,
} from "@/shared/constants";

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / MILLISECONDS_PER_DAY
  );
  if (diffInDays < RELATIVE_DATE_THRESHOLD_DAYS) {
    return new Intl.RelativeTimeFormat("en-US", { numeric: "auto" }).format(
      -diffInDays,
      "day"
    );
  }
  return formatAbsoluteDate(date);
}

export function formatAbsoluteDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
