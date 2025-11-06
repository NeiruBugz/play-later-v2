/**
 * Date formatting utilities for consistent date display across the application.
 */

/**
 * Formats a date with relative time for recent dates (<7 days) and absolute format for older dates.
 *
 * Examples:
 * - Today: "today"
 * - Yesterday: "yesterday"
 * - 3 days ago: "3 days ago"
 * - 10 days ago: "Jan 27, 2025"
 *
 * @param date - The date to format
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatRelativeDate(new Date()) // "today"
 * formatRelativeDate(new Date(Date.now() - 86400000)) // "yesterday"
 * formatRelativeDate(new Date("2025-01-01")) // "Jan 1, 2025"
 * ```
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays < 7) {
    return new Intl.RelativeTimeFormat("en-US", { numeric: "auto" }).format(
      -diffInDays,
      "day"
    );
  }

  return formatAbsoluteDate(date);
}

/**
 * Formats a date in absolute "MMM dd, yyyy" format.
 *
 * Examples:
 * - "Jan 27, 2025"
 * - "Dec 25, 2024"
 *
 * @param date - The date to format
 * @returns Formatted date string in "MMM dd, yyyy" format
 *
 * @example
 * ```typescript
 * formatAbsoluteDate(new Date("2025-01-27")) // "Jan 27, 2025"
 * formatAbsoluteDate(new Date("2024-12-25")) // "Dec 25, 2024"
 * ```
 */
export function formatAbsoluteDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
