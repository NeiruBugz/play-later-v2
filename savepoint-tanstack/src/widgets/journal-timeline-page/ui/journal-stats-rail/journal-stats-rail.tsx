import { Link } from "@tanstack/react-router";

import { Button } from "@/shared/ui/button";

import type { JournalStatsRailProps } from "./journal-stats-rail.type";

/** Derives per-game unique count and total minutes from the entries list. */
function deriveStats(entries: JournalStatsRailProps["entries"]) {
  const gameIds = new Set(
    entries.flatMap((e) => (e.game !== null ? [e.game.id] : []))
  );
  const totalMinutes = entries.reduce((sum) => sum, 0);

  return {
    entryCount: entries.length,
    gamesJournaled: gameIds.size,
    hoursReflected: Math.round(totalMinutes / 60),
  };
}

/**
 * Desktop-only stats rail for the journal page.
 *
 * Pairs with the timeline to give a quick summary of recent journaling
 * activity (AC JRN-4). Rendered only when `useIsDesktop()` is true — the
 * parent `JournalTimelinePage` owns the breakpoint gate.
 *
 * FSD: widget-internal component, not exported from the widget barrel.
 */
export function JournalStatsRail({ entries }: JournalStatsRailProps) {
  const { entryCount, gamesJournaled } = deriveStats(entries);

  return (
    <aside
      aria-label="Journaling stats"
      className="bg-card text-card-foreground border-border flex flex-col gap-6 rounded-xl border p-6"
    >
      <h2 className="text-sm font-semibold tracking-wide uppercase opacity-60">
        Your journal
      </h2>

      <dl className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground text-sm">Entries</dt>
          <dd className="text-foreground text-lg font-bold">{entryCount}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground text-sm">Games journaled</dt>
          <dd className="text-foreground text-lg font-bold">
            {gamesJournaled}
          </dd>
        </div>
      </dl>

      <Button asChild className="mt-auto w-full">
        <Link to="/journal/new">Log tonight</Link>
      </Button>
    </aside>
  );
}
