"use client";

import Link from "next/link";
import {
  Bookmark,
  Eye,
  Gamepad2,
  Clock,
  Trophy,
  RotateCcw,
  Library,
} from "lucide-react";

import { Card } from "@/shared/components/ui/card";
import {
  ProgressRing,
  type GameStatus,
} from "@/shared/components/ui/progress-ring";
import { cn } from "@/shared/lib/ui";

import type { DashboardStatsData } from "./dashboard-stats-server";

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
          "relative overflow-hidden p-xl",
          "transition-all duration-normal ease-out-expo",
          "hover:shadow-paper-md hover:scale-[1.02]"
        )}
      >
        <div className="flex items-center gap-lg">
          <div className="relative">
            <ProgressRing
              status={status}
              progress={percentage}
              size="sm"
              animated
              className="transition-transform duration-normal group-hover:scale-110"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-muted-foreground">{icon}</div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="heading-lg font-serif tabular-nums">{count}</p>
            <p className="body-sm text-muted-foreground truncate">{label}</p>
          </div>

          {percentage > 0 && (
            <div className="body-xs text-muted-foreground/60 tabular-nums">
              {percentage}%
            </div>
          )}
        </div>

        <div
          className="absolute bottom-0 left-0 h-1 transition-all duration-slow ease-out-expo"
          style={{
            width: `${percentage}%`,
            backgroundColor: `var(--status-${status.toLowerCase()})`,
          }}
        />
      </Card>
    </Link>
  );
}

interface DashboardStatsCardsProps {
  stats: DashboardStatsData;
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const statItems: Omit<StatCardProps, "index" | "total">[] = [
    {
      label: "Total Games",
      count: stats.total,
      icon: <Library className="h-4 w-4" />,
      status: "PLAYING",
      href: "/library",
    },
    {
      label: "Currently Exploring",
      count: stats.currentlyExploring,
      icon: <Gamepad2 className="h-4 w-4" />,
      status: "PLAYING",
      href: "/library?status=CURRENTLY_EXPLORING",
    },
    {
      label: "Experienced",
      count: stats.experienced,
      icon: <Trophy className="h-4 w-4" />,
      status: "EXPERIENCED",
      href: "/library?status=EXPERIENCED",
    },
    {
      label: "Curious About",
      count: stats.curiousAbout,
      icon: <Eye className="h-4 w-4" />,
      status: "CURIOUS",
      href: "/library?status=CURIOUS_ABOUT",
    },
    {
      label: "Taking a Break",
      count: stats.tookABreak,
      icon: <Clock className="h-4 w-4" />,
      status: "BREAK",
      href: "/library?status=TOOK_A_BREAK",
    },
    {
      label: "Wishlist",
      count: stats.wishlist,
      icon: <Bookmark className="h-4 w-4" />,
      status: "WISHLIST",
      href: "/library?status=WISHLIST",
    },
    {
      label: "Revisiting",
      count: stats.revisiting,
      icon: <RotateCcw className="h-4 w-4" />,
      status: "REVISITING",
      href: "/library?status=REVISITING",
    },
  ];

  return (
    <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
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
