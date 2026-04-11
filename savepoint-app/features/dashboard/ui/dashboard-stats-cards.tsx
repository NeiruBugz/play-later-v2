import { Library } from "lucide-react";
import Link from "next/link";

import { Card } from "@/shared/components/ui/card";
import {
  getStatusLabel,
  LIBRARY_STATUS_CONFIG,
} from "@/shared/lib/library-status";
import { LibraryItemStatus } from "@/shared/types/library";

import type { DashboardStatsData } from "./dashboard-stats";

interface DashboardStatsCardsProps {
  stats: DashboardStatsData;
}

const STATUS_CSS_MAP: Record<string, string> = {
  [LibraryItemStatus.PLAYED]: "played",
  [LibraryItemStatus.PLAYING]: "playing",
  [LibraryItemStatus.UP_NEXT]: "upNext",
  [LibraryItemStatus.SHELF]: "shelf",
  [LibraryItemStatus.WISHLIST]: "wishlist",
};

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const maxCount = Math.max(
    ...LIBRARY_STATUS_CONFIG.map((s) => getStatCount(stats, s.value)),
    1
  );

  return (
    <Card
      variant="elevated"
      className="p-xl y2k-gradient-cyan y2k-border-pulse jewel-breathe-slow overflow-hidden"
    >
      <Link href="/library" className="block">
        <div className="mb-lg flex items-center gap-3">
          <Library className="text-muted-foreground y2k-neon-text jewel-neon-text h-5 w-5" />
          <span className="text-muted-foreground y2k-neon-text y2k-mono y2k:tracking-[0.2em] jewel-meta jewel:text-[0.72rem] text-sm font-medium tracking-wider uppercase">
            // LIBRARY
          </span>
        </div>
        <p className="mb-xs y2k-chrome-text y2k:text-6xl jewel:text-6xl jewel-neon-text jewel:tracking-[-0.02em] text-5xl font-bold tabular-nums">
          {stats.total}
        </p>
        <p className="text-muted-foreground y2k-mono jewel-meta mb-xl text-sm">
          Total Games
        </p>

        {/* Jewel: PS2 boot-tower visualization — vertical glass columns rising by count.
            Hidden in non-jewel themes, which keep the original horizontal progress bar. */}
        <div
          aria-hidden
          className="jewel:flex mb-lg hidden h-24 items-end justify-between gap-3"
        >
          {LIBRARY_STATUS_CONFIG.map((statusConfig, i) => {
            const count = getStatCount(stats, statusConfig.value);
            const heightPct = (count / maxCount) * 100;
            return (
              <div
                key={statusConfig.value}
                className="jewel-tower group/tower relative flex-1"
                style={{
                  ["--tower-h" as string]: `${heightPct}%`,
                  animationDelay: `${i * 120}ms`,
                }}
              >
                <div
                  className="jewel-tower-fill"
                  style={{
                    backgroundColor: `var(--status-${STATUS_CSS_MAP[statusConfig.value]})`,
                  }}
                />
                <span className="jewel-tower-count">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Non-jewel themes keep the horizontal progress bar */}
        <div className="mb-lg y2k-progress-glow y2k:h-3 jewel:hidden flex h-2.5 overflow-hidden rounded-full">
          {LIBRARY_STATUS_CONFIG.map((statusConfig) => {
            const count = getStatCount(stats, statusConfig.value);
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={statusConfig.value}
                className="transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: `var(--status-${STATUS_CSS_MAP[statusConfig.value]})`,
                }}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {LIBRARY_STATUS_CONFIG.map((statusConfig) => {
            const count = getStatCount(stats, statusConfig.value);
            return (
              <div
                key={statusConfig.value}
                className="flex items-center gap-1.5"
              >
                <div
                  className="jewel-dot h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: `var(--status-${STATUS_CSS_MAP[statusConfig.value]})`,
                  }}
                />
                <span className="text-muted-foreground jewel-meta jewel:text-[0.64rem] text-xs">
                  {getStatusLabel(statusConfig.value)}{" "}
                  <span className="text-foreground font-medium tabular-nums">
                    {count}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </Link>
    </Card>
  );
}

const statusFieldMap: Record<LibraryItemStatus, keyof DashboardStatsData> = {
  [LibraryItemStatus.WISHLIST]: "wishlist",
  [LibraryItemStatus.SHELF]: "shelf",
  [LibraryItemStatus.UP_NEXT]: "upNext",
  [LibraryItemStatus.PLAYING]: "playing",
  [LibraryItemStatus.PLAYED]: "played",
};

function getStatCount(
  stats: DashboardStatsData,
  status: LibraryItemStatus
): number {
  return stats[statusFieldMap[status]];
}
