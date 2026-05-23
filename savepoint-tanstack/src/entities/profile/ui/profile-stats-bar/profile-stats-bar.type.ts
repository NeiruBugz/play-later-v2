export type StatItem = {
  label: string;
  value: number;
};

export type ProfileStatsBarProps = {
  totalGames: number;
  playing: number;
  completed: number;
  journalEntries: number;
};
