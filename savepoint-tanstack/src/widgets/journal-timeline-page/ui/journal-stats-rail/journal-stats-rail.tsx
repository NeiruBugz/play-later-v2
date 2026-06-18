import { Link } from "@tanstack/react-router";

import { Button } from "@/shared/ui/button";

import type { JournalStatsRailProps } from "./journal-stats-rail.type";

function deriveStats(entries: JournalStatsRailProps["entries"]) {
  const gameIds = new Set(
    entries.flatMap((e) => (e.game !== null ? [e.game.id] : []))
  );

  return {
    entryCount: entries.length,
    gamesJournaled: gameIds.size,
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
    <aside aria-label="Journaling stats" className="flex flex-col gap-4">
      <div className="bg-card text-card-foreground border-border rounded-xl border p-5">
        <div className="terminal-label mb-4">// THIS MONTH</div>

        <dl className="flex flex-col gap-4">
          <div>
            <dd className="text-foreground font-display text-[1.8rem] leading-none font-bold tabular-nums">
              {entryCount}
            </dd>
            <dt className="text-muted-foreground mt-1 text-sm">Entries</dt>
          </div>
          <div>
            <dd className="text-foreground font-display text-[1.8rem] leading-none font-bold tabular-nums">
              {gamesJournaled}
            </dd>
            <dt className="text-muted-foreground mt-1 text-sm">
              Games journaled
            </dt>
          </div>
        </dl>
      </div>

      <div
        className="border-primary/22 bg-card rounded-xl border p-[18px]"
        style={{
          background: "color-mix(in oklch, var(--primary) 6%, var(--card))",
          borderColor: "color-mix(in oklch, var(--primary) 22%, transparent)",
        }}
      >
        <div className="terminal-label mb-2">// LOG TONIGHT</div>
        <p className="text-foreground-body mb-4 text-sm leading-relaxed">
          Playtime is enough — thoughts are optional. Reflections can come
          later.
        </p>
        <Button asChild className="w-full">
          <Link to="/journal/new">Log a session</Link>
        </Button>
      </div>
    </aside>
  );
}
