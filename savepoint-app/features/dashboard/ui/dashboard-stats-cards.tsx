import { LibraryItemStatus } from "@/data-access-layer/domain/library";
import { Library } from "lucide-react";
import Link from "next/link";

import { Card } from "@/shared/components/ui/card";
import {
  ProgressRing,
  type GameStatus,
} from "@/shared/components/ui/progress-ring";
import {
  getStatusIcon,
  getStatusLabel,
  LIBRARY_STATUS_CONFIG,
} from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";

import type { DashboardStatsData } from "./dashboard-stats";

interface StatCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  status: GameStatus;
  href: string;
  index: number;
  total: number;
}

function StatCard({
  label,
  count,
  icon,
  status,
  href,
  index,
  total,
}: StatCardProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <Link
      href={href}
      className={cn(
        "group block",
        "animate-stagger-in",
        `stagger-${index + 1}`,
        "duration-normal ease-out-expo"
      )}
      style={{ animationDelay: `${(index + 1) * 50}ms` }}
    >
      <Card
        variant="interactive"
        className={cn(
          "p-xl relative overflow-hidden",
          "duration-normal ease-out-expo transition-all",
          "hover:shadow-paper-md hover:scale-[1.02]"
        )}
      >
        <div className="gap-lg flex items-center">
          <div className="relative">
            <ProgressRing
              status={status}
              progress={percentage}
              size="sm"
              animated
              className="duration-normal transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-muted-foreground">{icon}</div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-2xl font-semibold tabular-nums">{count}</p>
            <p className="body-sm text-muted-foreground truncate">{label}</p>
          </div>

          {percentage > 0 && (
            <div className="body-xs text-muted-foreground tabular-nums">
              {percentage}%
            </div>
          )}
        </div>

        {/* <div
          className="duration-slow ease-out-expo absolute bottom-0 left-0 h-1 transition-all"
          style={{
            width: `${percentage}%`,
            backgroundColor: `var(--status-${status.toLowerCase()})`,
          }}
        /> */}
      </Card>
    </Link>
  );
}

interface DashboardStatsCardsProps {
  stats: DashboardStatsData;
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const statusMap: Record<
    LibraryItemStatus,
    { count: number; gameStatus: GameStatus }
  > = {
    [LibraryItemStatus.WANT_TO_PLAY]: {
      count: stats.wantToPlay,
      gameStatus: "WANT_TO_PLAY",
    },
    [LibraryItemStatus.OWNED]: { count: stats.owned, gameStatus: "OWNED" },
    [LibraryItemStatus.PLAYING]: {
      count: stats.playing,
      gameStatus: "PLAYING",
    },
    [LibraryItemStatus.PLAYED]: { count: stats.played, gameStatus: "PLAYED" },
  };

  const statItems: Omit<StatCardProps, "index" | "total">[] = [
    {
      label: "Total Games",
      count: stats.total,
      icon: <Library className="h-4 w-4" />,
      status: "PLAYING",
      href: "/library",
    },
    ...LIBRARY_STATUS_CONFIG.map((statusConfig) => {
      const Icon = getStatusIcon(statusConfig.value);
      const { count, gameStatus } = statusMap[statusConfig.value];
      return {
        label: getStatusLabel(statusConfig.value),
        count,
        icon: <Icon className="h-4 w-4" />,
        status: gameStatus,
        href: `/library?status=${statusConfig.value}`,
      };
    }),
  ];

  return (
    <div className="gap-lg grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {statItems.map((item, index) => (
        <StatCard
          key={item.label}
          {...item}
          index={index}
          total={stats.total}
        />
      ))}
    </div>
  );
}
