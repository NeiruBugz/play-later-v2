import { BookOpen, Library } from "lucide-react";
import Link from "next/link";

import { Card } from "@/shared/components/ui/card";
import {
  getStatusIcon,
  getStatusLabel,
  LIBRARY_STATUS_CONFIG,
} from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";
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
  const statusItems = LIBRARY_STATUS_CONFIG.filter(
    (s) => getStatCount(stats, s.value) > 0
  );

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        variant="elevated"
        className="p-xl relative overflow-hidden sm:col-span-2 lg:row-span-2"
      >
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

          <div className="grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-5">
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
                    <span className="text-foreground font-medium">{count}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Link>
      </Card>

      {statusItems.slice(0, 4).map((statusConfig, index) => {
        const Icon = getStatusIcon(statusConfig.value);
        const count = getStatCount(stats, statusConfig.value);
        const pct =
          stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

        return (
          <Link
            key={statusConfig.value}
            href={`/library?status=${statusConfig.value}`}
            className={cn(
              "animate-stagger-in group block",
              `stagger-${index + 1}`
            )}
            style={{ animationDelay: `${(index + 1) * 50}ms` }}
          >
            <Card
              variant="interactive"
              className="p-lg relative h-full overflow-hidden"
            >
              <div className="text-muted-foreground mb-md">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold tabular-nums">{count}</p>
              <p className="text-muted-foreground text-xs font-medium">
                {getStatusLabel(statusConfig.value)}
              </p>
              {pct > 0 && (
                <p
                  className="mt-xs text-xs font-medium tabular-nums"
                  style={{
                    color: `var(--status-${STATUS_CSS_MAP[statusConfig.value]})`,
                  }}
                >
                  {pct}%
                </p>
              )}
              <div
                className="absolute bottom-0 left-0 h-0.5"
                style={{
                  width: `${pct}%`,
                  backgroundColor: `var(--status-${STATUS_CSS_MAP[statusConfig.value]})`,
                }}
              />
            </Card>
          </Link>
        );
      })}

      <Link
        href="/journal"
        className="animate-stagger-in stagger-5 group block"
      >
        <Card
          variant="interactive"
          className="p-lg relative flex h-full flex-col justify-between overflow-hidden sm:col-span-2 lg:col-span-1"
        >
          <div className="text-muted-foreground mb-md">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <p className="text-3xl font-bold tabular-nums">
              {stats.played + stats.playing}
            </p>
            <p className="text-muted-foreground text-xs font-medium">
              Games Experienced
            </p>
          </div>
        </Card>
      </Link>
    </div>
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
