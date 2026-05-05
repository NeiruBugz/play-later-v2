import { Card } from "@/shared/ui/card";

type StatItem = {
  label: string;
  value: number;
};

type ProfileStatsBarProps = {
  totalGames: number;
  playing: number;
  completed: number;
  journalEntries: number;
};

export function ProfileStatsBar({
  totalGames,
  playing,
  completed,
  journalEntries,
}: ProfileStatsBarProps) {
  const stats: StatItem[] = [
    { label: "In Library", value: totalGames },
    { label: "Playing", value: playing },
    { label: "Completed", value: completed },
    { label: "Journal Entries", value: journalEntries },
  ];

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      data-testid="profile-stats-bar"
    >
      {stats.map(({ label, value }) => (
        <Card
          key={label}
          className="p-4 text-center"
          data-testid="profile-stats-bar-item"
        >
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-muted-foreground mt-0.5 text-xs font-medium">
            {label}
          </p>
        </Card>
      ))}
    </div>
  );
}

export type { ProfileStatsBarProps };
