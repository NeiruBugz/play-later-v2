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
  return (
    <Card variant="elevated" className="p-xl overflow-hidden">
      <Link href="/library" className="block">
        <div className="mb-lg flex items-center gap-3">
          <Library className="text-muted-foreground h-5 w-5" />
          <span className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
            Library
          </span>
        </div>
        <p className="mb-xs text-5xl font-bold tabular-nums">{stats.total}</p>
        <p className="text-muted-foreground mb-xl text-sm">Total Games</p>

        <div className="mb-lg flex h-2.5 overflow-hidden rounded-full">
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
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: `var(--status-${STATUS_CSS_MAP[statusConfig.value]})`,
                  }}
                />
                <span className="text-muted-foreground text-xs">
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
