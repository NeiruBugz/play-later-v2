export { applyReleaseCheck, isDueForCheck } from "./release-check";
export type {
  CheckableGame,
  FreshRelease,
  ReleaseCheckUpdate,
  StoredRelease,
} from "./release-check";
export {
  describeReleaseFact,
  deviceToday,
  formatComingSoonWhen,
  formatReleaseLabel,
  groupByMonth,
  isUpcomingRelease,
  releasePeriodEnd,
  selectComingSoon,
  shouldShowMovedLine,
  toStoredDay,
} from "./release-date";
export type {
  CalendarDay,
  ComingSoonCandidate,
  ReleaseDatePrecision,
  ReleaseFact,
  ReleaseGame,
} from "./release-date";
