export interface Statistics {
  totalGames: number;
  gamesCompleted: number;
  gamesDropped: number;
  gamesPlaying: number;
  gamesOnHold: number;
  totalHoursPlayed: number;
  averageRating: number;
  achievementsUnlocked: number;
  platinumsEarned: number;
}

export interface StatisticsGroup {
  platformStatistics: Statistics[];
  genreStatistics: Statistics[];
  yearStatistics: Statistics[];
  developerStatistics: Statistics[];
  publisherStatistics: Statistics[];
}
