import { Link } from "@tanstack/react-router";

import {
  formatReleaseLabel,
  groupByMonth,
  shouldShowMovedLine,
  toStoredDay,
} from "@/entities/game";
import { NotOwnedTag, toStatusChipStatus } from "@/entities/library-item";
import { formatCalendarDay } from "@/shared/lib/date";
import { useDeviceToday } from "@/shared/lib/hooks/use-device-today";
import { GameCover } from "@/shared/ui/game-cover";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionLabel } from "@/shared/ui/section-label";
import { StatusChip } from "@/shared/ui/status-chip";

import type {
  UpcomingReleasesPageEntry,
  UpcomingReleasesPageProps,
} from "./upcoming-releases-page.type";

const EMPTY_MESSAGE =
  "No upcoming releases with a set date. Games appear here once their release day is announced.";

function formatWeekdayAndDayOfMonth(day: string): string {
  return formatCalendarDay(day, { weekday: true }).split(" ", 2).join(" ");
}

function UpcomingReleaseRow({
  entry,
  today,
}: {
  entry: UpcomingReleasesPageEntry;
  today: string;
}) {
  const { game } = entry;
  const releaseDay = toStoredDay(game.releaseDate);
  const whenText =
    releaseDay === today ? "Out today" : formatWeekdayAndDayOfMonth(releaseDay);
  const coverName = game.coverImage ? game.title : "";
  const movedFromLabel =
    game.releaseDateMovedFrom && shouldShowMovedLine(game, today)
      ? formatReleaseLabel(
          {
            releaseDate: game.releaseDateMovedFrom,
            releaseDatePrecision: "DAY",
          },
          { today }
        )
      : null;

  return (
    <li>
      <Link
        to="/games/$slug"
        params={{ slug: game.slug }}
        className="group flex min-h-14 items-center gap-3 py-2 hover:bg-muted/50"
      >
        <span className="w-16 shrink-0 text-sm font-medium tabular-nums">
          {whenText}
        </span>
        <GameCover src={game.coverImage} name={coverName} size="xs" />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-base font-medium group-hover:underline">
            {game.title}
          </span>
          <span className="flex flex-wrap items-center gap-1 empty:hidden">
            <StatusChip status={toStatusChipStatus(entry.status)} />
            <NotOwnedTag status={entry.status} isOwned={entry.isOwned} />
          </span>
          {movedFromLabel ? (
            <span className="text-xs text-muted-foreground">
              Moved from {movedFromLabel}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

export function UpcomingReleasesPage({ entries }: UpcomingReleasesPageProps) {
  const today = useDeviceToday();
  const monthSections = groupByMonth(
    entries
      .filter(({ game }) => toStoredDay(game.releaseDate) >= today)
      .map((entry) => ({ ...entry, releaseDate: entry.game.releaseDate }))
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 md:py-6">
      <PageHeader title="Upcoming releases" />
      {monthSections.length === 0 ? (
        <p className="text-sm text-muted-foreground">{EMPTY_MESSAGE}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {monthSections.map(({ monthKey, heading, entries: monthEntries }) => (
            <section key={monthKey} aria-labelledby={`month-${monthKey}`}>
              <SectionLabel id={`month-${monthKey}`} className="mb-1">
                {heading}
              </SectionLabel>
              <ul>
                {monthEntries.map((entry) => (
                  <UpcomingReleaseRow
                    key={entry.id}
                    entry={entry}
                    today={today}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
