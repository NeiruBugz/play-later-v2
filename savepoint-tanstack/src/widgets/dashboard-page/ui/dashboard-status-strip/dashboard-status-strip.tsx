import { Link } from "@tanstack/react-router";

import { STATUS_ENTRIES } from "@/entities/library-item/model/status";

import type { DashboardStatusStripProps } from "./dashboard-status-strip.type";

/**
 * Compact single-row summary of the library status distribution.
 * Replaces the full-height `DashboardStatsCard` on mobile (AC DASH-3).
 * Each pill links to the filtered library view.
 */
export function DashboardStatusStrip({
  statusCounts,
  total,
}: DashboardStatusStripProps) {
  return (
    <div
      aria-label="Library status summary"
      className="mb-4 flex items-center gap-2 overflow-x-auto pb-1"
    >
      <span className="text-muted-foreground shrink-0 text-xs">
        <span className="text-foreground font-semibold tabular-nums">
          {total}
        </span>{" "}
        games
      </span>

      <div className="bg-border h-3 w-px shrink-0" aria-hidden="true" />

      {STATUS_ENTRIES.filter(
        (entry) => (statusCounts[entry.value] ?? 0) > 0
      ).map((entry) => {
        const count = statusCounts[entry.value] ?? 0;
        return (
          <Link
            key={entry.value}
            to="/library"
            search={{ status: entry.value }}
            className="bg-card border-border/60 text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: `var(--status-${entry.badgeVariant})`,
              }}
              aria-hidden="true"
            />
            {entry.label}{" "}
            <span className="text-foreground font-medium tabular-nums">
              {count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
