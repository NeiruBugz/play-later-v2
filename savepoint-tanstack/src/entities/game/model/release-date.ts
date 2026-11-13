import {
  formatCalendarDay,
  toLocalCalendarDay,
  toUtcCalendarDay,
} from "@/shared/lib/date";

export type ReleaseDatePrecision = "DAY" | "MONTH" | "QUARTER" | "YEAR" | "TBA";

export type CalendarDay = string;

export interface ReleaseGame {
  releaseDate: Date | null;
  releaseDatePrecision: ReleaseDatePrecision | null;
}

export interface ReleaseFact {
  term: "Releases" | "Released" | "Release date";
  value: string;
}

const MONTHS_PER_QUARTER = 3;
const MILLISECONDS_PER_DAY = 86_400_000;

const MONTH_WITH_YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function splitCalendarDay(day: CalendarDay) {
  const [year, month, dayOfMonth] = day.split("-").map(Number);
  return { year, month, dayOfMonth };
}

function lastDayOfMonth(year: number, month: number): CalendarDay {
  const dayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return toUtcCalendarDay(new Date(Date.UTC(year, month - 1, dayOfMonth)));
}

export function toStoredDay(date: Date): CalendarDay {
  return toUtcCalendarDay(date);
}

export function deviceToday(now: Date): CalendarDay {
  return toLocalCalendarDay(now);
}

export function releasePeriodEnd({
  releaseDate,
  releaseDatePrecision,
}: ReleaseGame): CalendarDay | null {
  if (!releaseDate) return null;
  const periodStart = toStoredDay(releaseDate);
  const { year, month } = splitCalendarDay(periodStart);

  switch (releaseDatePrecision) {
    case "DAY":
      return periodStart;
    case "MONTH":
      return lastDayOfMonth(year, month);
    case "QUARTER":
      return lastDayOfMonth(year, month + MONTHS_PER_QUARTER - 1);
    case "YEAR":
      return lastDayOfMonth(year, 12);
    default:
      return null;
  }
}

export function isUpcomingRelease(
  game: ReleaseGame,
  today: CalendarDay
): boolean {
  if (game.releaseDatePrecision === "TBA") return true;
  const periodEnd = releasePeriodEnd(game);
  return periodEnd !== null && periodEnd >= today;
}

export function formatReleaseLabel(
  game: ReleaseGame,
  { today, alwaysYear = false }: { today: CalendarDay; alwaysYear?: boolean }
): string | null {
  const { releaseDate, releaseDatePrecision } = game;
  if (releaseDatePrecision === "TBA") return "Date TBA";
  if (!releaseDate || !releaseDatePrecision) return null;

  const periodStart = toStoredDay(releaseDate);
  const { year, month } = splitCalendarDay(periodStart);

  switch (releaseDatePrecision) {
    case "DAY":
      return formatCalendarDay(periodStart, {
        year: alwaysYear || year !== splitCalendarDay(today).year,
      });
    case "MONTH":
      return MONTH_WITH_YEAR_FORMATTER.format(releaseDate);
    case "QUARTER":
      return `Q${Math.floor((month - 1) / MONTHS_PER_QUARTER) + 1} ${year}`;
    case "YEAR":
      return String(year);
  }
}

const MOVED_LINE_VISIBLE_DAYS = 14;
const COMING_SOON_WINDOW_DAYS = 30;
const COMING_SOON_LIMIT = 3;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface ComingSoonCandidate {
  id: number;
  game: {
    slug: string;
    title: string;
    coverImage: string | null;
    releaseDate: Date;
    releaseDatePrecision: ReleaseDatePrecision;
  };
}

function calendarDayNumber(day: CalendarDay): number {
  const { year, month, dayOfMonth } = splitCalendarDay(day);
  return Date.UTC(year, month - 1, dayOfMonth) / MILLISECONDS_PER_DAY;
}

function daysBetween(from: CalendarDay, to: CalendarDay): number {
  return calendarDayNumber(to) - calendarDayNumber(from);
}

export function shouldShowMovedLine(
  game: { releaseDateMovedFrom: Date | null; releaseDateMovedAt: Date | null },
  today: CalendarDay
): boolean {
  const { releaseDateMovedFrom, releaseDateMovedAt } = game;
  if (!releaseDateMovedFrom || !releaseDateMovedAt) return false;
  return (
    daysBetween(toStoredDay(releaseDateMovedAt), today) <=
    MOVED_LINE_VISIBLE_DAYS
  );
}

export function formatComingSoonWhen(
  day: CalendarDay,
  today: CalendarDay
): string {
  const daysAway = daysBetween(today, day);
  if (daysAway === 0) return "Out today";
  if (daysAway === 1) return "Tomorrow";
  return formatCalendarDay(day, {
    weekday: true,
    year: splitCalendarDay(day).year === splitCalendarDay(today).year + 1,
  });
}

export function selectComingSoon(
  candidates: ComingSoonCandidate[],
  today: CalendarDay,
  {
    days = COMING_SOON_WINDOW_DAYS,
    limit = COMING_SOON_LIMIT,
  }: { days?: number; limit?: number } = {}
): ComingSoonCandidate[] {
  return candidates
    .filter(({ game }) => {
      if (game.releaseDatePrecision !== "DAY") return false;
      const daysAway = daysBetween(today, toStoredDay(game.releaseDate));
      return daysAway >= 0 && daysAway <= days;
    })
    .sort(
      (a, b) =>
        a.game.releaseDate.getTime() - b.game.releaseDate.getTime() ||
        a.game.title.localeCompare(b.game.title)
    )
    .slice(0, limit);
}

export function groupByMonth<T extends { releaseDate: Date }>(
  entries: T[]
): Array<{ monthKey: string; heading: string; entries: T[] }> {
  const groups: Array<{ monthKey: string; heading: string; entries: T[] }> = [];
  for (const entry of entries) {
    const year = entry.releaseDate.getUTCFullYear();
    const month = entry.releaseDate.getUTCMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const lastGroup = groups.at(-1);
    if (lastGroup?.monthKey === monthKey) {
      lastGroup.entries.push(entry);
    } else {
      groups.push({
        monthKey,
        heading: `${MONTH_NAMES[month]} ${year}`,
        entries: [entry],
      });
    }
  }
  return groups;
}

export function describeReleaseFact(
  game: ReleaseGame,
  today: CalendarDay
): ReleaseFact | null {
  const label = formatReleaseLabel(game, { today, alwaysYear: true });
  if (label === null) return null;
  if (game.releaseDatePrecision === "TBA") {
    return { term: "Release date", value: "TBA" };
  }
  return {
    term: isUpcomingRelease(game, today) ? "Releases" : "Released",
    value: label,
  };
}
