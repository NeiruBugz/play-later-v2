import { Link } from "@tanstack/react-router";

import { STATUS_ENTRIES } from "@/entities/library-item/model/status";

import type { DashboardStatusStripProps } from "./dashboard-status-strip.type";

/**
 * The single set of status counts on Home. Each pill links to the filtered
 * library view.
 */
export function DashboardStatusStrip({ counts }: DashboardStatusStripProps) {
  const total = counts.WANT + counts.PLAYING + counts.DONE;
  return (
    <div
      aria-label="Library status summary"
      className="mb-4 flex items-center gap-2 overflow-x-auto pb-1"
    >
      <span className="shrink-0 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">
          {total}
        </span>{" "}
        games
      </span>

      <div className="h-3 w-px shrink-0 bg-border" aria-hidden="true" />

      {STATUS_ENTRIES.filter((entry) => (counts[entry.value] ?? 0) > 0).map(
        (entry) => {
          const count = counts[entry.value] ?? 0;
          return (
            <Link
              key={entry.value}
              to="/library"
              search={{ status: entry.value }}
              className="flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: `var(--status-${entry.badgeVariant})`,
                }}
                aria-hidden="true"
              />
              {entry.label}{" "}
              <span className="font-medium text-foreground tabular-nums">
                {count}
              </span>
            </Link>
          );
        }
      )}
    </div>
  );
}
