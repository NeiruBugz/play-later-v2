import { BookOpen, Gamepad2, Library, Trophy } from "lucide-react";

import { Card } from "@/shared/components/ui/card";

interface StatItem {
  label: string;
  value: number;
  icon: React.ReactNode;
}

interface ProfileStatsBarProps {
  totalGames: number;
  playing: number;
  completed: number;
  journalEntries: number;
}

export function ProfileStatsBar({
  totalGames,
  playing,
  completed,
  journalEntries,
}: ProfileStatsBarProps) {
  const stats: StatItem[] = [
    {
      label: "In Library",
      value: totalGames,
      icon: <Library className="h-4 w-4" />,
    },
    {
      label: "Playing",
      value: playing,
      icon: <Gamepad2 className="h-4 w-4" />,
    },
    {
      label: "Completed",
      value: completed,
      icon: <Trophy className="h-4 w-4" />,
    },
    {
      label: "Journal Entries",
      value: journalEntries,
      icon: <BookOpen className="h-4 w-4" />,
    },
  ];

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      data-testid="profile-stats-bar"
    >
      {stats.map(({ label, value, icon }, index) => (
        <Card
          key={label}
          variant="elevated"
          className="animate-fade-in p-lg text-center"
          style={{ animationDelay: `${(index + 1) * 50}ms` }}
          data-testid="profile-stats-bar-item"
        >
          <div className="text-muted-foreground mx-auto mb-2">{icon}</div>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-muted-foreground mt-0.5 text-xs font-medium">
            {label}
          </p>
        </Card>
      ))}
    </div>
  );
}
