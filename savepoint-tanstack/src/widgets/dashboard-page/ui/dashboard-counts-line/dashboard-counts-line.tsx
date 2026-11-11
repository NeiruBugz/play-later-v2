import { Link } from "@tanstack/react-router";
import { Fragment } from "react";

import { STATUS_ENTRIES } from "@/entities/library-item/model/status";

import type { DashboardCountsLineProps } from "./dashboard-counts-line.type";

export function DashboardCountsLine({ counts }: DashboardCountsLineProps) {
  const total = counts.WANT + counts.PLAYING + counts.DONE;
  if (total === 0) return null;

  const statusParts = STATUS_ENTRIES.filter(
    (entry) => (counts[entry.value] ?? 0) > 0
  );

  return (
    <p
      data-testid="dashboard-counts-line"
      className="text-sm text-muted-foreground tabular-nums"
    >
      <span>{total === 1 ? "1 game" : `${total} games`}</span>
      {statusParts.map((entry) => (
        <Fragment key={entry.value}>
          <span aria-hidden="true"> · </span>
          <Link
            to="/library"
            search={{ status: entry.value }}
            className="inline-flex min-h-11 items-center hover:text-foreground hover:underline md:min-h-0"
          >
            {counts[entry.value]} {entry.label.toLowerCase()}
          </Link>
        </Fragment>
      ))}
    </p>
  );
}
