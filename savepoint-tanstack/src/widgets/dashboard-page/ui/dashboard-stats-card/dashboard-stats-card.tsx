import { Link } from "@tanstack/react-router";
import { Library } from "lucide-react";

import { STATUS_ENTRIES } from "@/entities/library-item/model/status";

import type { DashboardStatsCardProps } from "./dashboard-stats-card.type";

export function DashboardStatsCard({
  statusCounts,
  total,
}: DashboardStatsCardProps) {
  return (
    <Link
      to="/library"
      className="bg-card text-card-foreground gap-lg p-xl flex flex-col overflow-hidden rounded-lg border"
    >
      <header className="flex items-center gap-3">
        <Library className="text-muted-foreground h-5 w-5" aria-hidden="true" />
        <span className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
          {"// LIBRARY"}
        </span>
      </header>

      <div>
        <p className="text-5xl font-bold tabular-nums">{total}</p>
        <p className="text-muted-foreground mt-1 text-sm">Total Games</p>
      </div>

      {/* Horizontal status-distribution bar. Each segment is sized
          proportionally; zero-count statuses contribute no visible band. */}
      <div className="flex h-2.5 overflow-hidden rounded-full">
        {STATUS_ENTRIES.map((entry) => {
          const count = statusCounts[entry.value] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={entry.value}
              className="transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: `var(--status-${entry.badgeVariant})`,
              }}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {STATUS_ENTRIES.map((entry) => {
          const count = statusCounts[entry.value] ?? 0;
          return (
            <div key={entry.value} className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: `var(--status-${entry.badgeVariant})`,
                }}
                aria-hidden="true"
              />
              <span className="text-muted-foreground text-xs">
                {entry.label}{" "}
                <span className="text-foreground font-medium tabular-nums">
                  {count}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
