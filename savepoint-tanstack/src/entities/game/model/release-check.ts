import { toUtcCalendarDay } from "@/shared/lib/date";

import {
  isUpcomingRelease,
  releasePeriodEnd,
  toStoredDay,
  type ReleaseDatePrecision,
} from "./release-date";

const MILLISECONDS_PER_HOUR = 3_600_000;
const HOURS_PER_DAY = 24;
const MILLISECONDS_PER_DAY = MILLISECONDS_PER_HOUR * HOURS_PER_DAY;
const DAILY_CHECK_WINDOW_DAYS = 14;
const DAILY_CHECK_INTERVAL_MS = MILLISECONDS_PER_DAY;
const WEEKLY_CHECK_INTERVAL_MS = 7 * MILLISECONDS_PER_DAY;

export interface StoredRelease {
  releaseDate: Date | null;
  releaseDatePrecision: ReleaseDatePrecision | null;
}

export interface CheckableGame extends StoredRelease {
  releaseDateCheckedAt: Date | null;
}

export interface FreshRelease {
  releaseDate: Date | null;
  precision: ReleaseDatePrecision | null;
}

export interface ReleaseCheckUpdate {
  releaseDateCheckedAt: Date;
  releaseDate?: Date | null;
  releaseDatePrecision?: ReleaseDatePrecision;
  releaseDateMovedFrom?: Date;
  releaseDateMovedAt?: Date;
}

const utcDayOffsetBy = (instant: Date, days: number) =>
  toUtcCalendarDay(new Date(instant.getTime() + days * MILLISECONDS_PER_DAY));

function isOldEnoughToRecheck(
  checkedAt: Date | null,
  now: Date,
  intervalMs: number
): boolean {
  return (
    checkedAt === null || now.getTime() - checkedAt.getTime() >= intervalMs
  );
}

export function isDueForCheck(game: CheckableGame, now: Date): boolean {
  const { releaseDate, releaseDatePrecision, releaseDateCheckedAt } = game;
  const yesterday = utcDayOffsetBy(now, -1);
  const isLegacyRow = releaseDatePrecision === null && releaseDate !== null;

  if (isLegacyRow && releaseDateCheckedAt === null) return true;

  const periodEnd = isLegacyRow
    ? toStoredDay(releaseDate)
    : releasePeriodEnd({ releaseDate, releaseDatePrecision });
  if (periodEnd !== null && periodEnd < yesterday) return false;

  const isExactDateWithinDailyWindow =
    releaseDatePrecision === "DAY" &&
    periodEnd !== null &&
    periodEnd <= utcDayOffsetBy(now, DAILY_CHECK_WINDOW_DAYS);

  return isOldEnoughToRecheck(
    releaseDateCheckedAt,
    now,
    isExactDateWithinDailyWindow
      ? DAILY_CHECK_INTERVAL_MS
      : WEEKLY_CHECK_INTERVAL_MS
  );
}

function isMoveOfUpcomingExactDay(
  stored: StoredRelease,
  fresh: FreshRelease,
  today: string
): boolean {
  if (stored.releaseDatePrecision !== "DAY" || !stored.releaseDate) {
    return false;
  }
  if (toStoredDay(stored.releaseDate) < today) return false;

  const isChanged =
    fresh.precision !== "DAY" ||
    fresh.releaseDate?.getTime() !== stored.releaseDate.getTime();
  if (!isChanged) return false;

  return isUpcomingRelease(
    { releaseDate: fresh.releaseDate, releaseDatePrecision: fresh.precision },
    today
  );
}

export function applyReleaseCheck(
  stored: StoredRelease,
  fresh: FreshRelease | "unknown",
  now: Date
): ReleaseCheckUpdate {
  if (fresh === "unknown" || fresh.precision === null) {
    return { releaseDateCheckedAt: now };
  }

  const update: ReleaseCheckUpdate = {
    releaseDateCheckedAt: now,
    releaseDate: fresh.releaseDate,
    releaseDatePrecision: fresh.precision,
  };

  if (
    stored.releaseDate &&
    isMoveOfUpcomingExactDay(stored, fresh, toUtcCalendarDay(now))
  ) {
    update.releaseDateMovedFrom = stored.releaseDate;
    update.releaseDateMovedAt = now;
  }

  return update;
}
