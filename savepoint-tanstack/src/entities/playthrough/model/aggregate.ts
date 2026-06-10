export type AggregatedPlaythroughs = {
  totalPlaytimeMinutes: number;
  count: number;
  bestRating: number | undefined;
  completion: string | undefined;
};

export function aggregatePlaythroughs(
  runs: ReadonlyArray<{
    playtimeMinutes: number;
    rating: number | null;
    completion: string | null;
  }>
): AggregatedPlaythroughs {
  const totalPlaytimeMinutes = runs.reduce(
    (sum, r) => sum + r.playtimeMinutes,
    0
  );

  const ratings = runs.map((r) => r.rating).filter((r) => r !== null);
  const bestRating = ratings.length > 0 ? Math.max(...ratings) : undefined;

  let completion: string | undefined;
  if (runs.some((r) => r.completion === "Platinum")) {
    completion = "Platinum";
  } else {
    completion =
      runs.find((r) => r.completion !== null)?.completion ?? undefined;
  }

  return {
    totalPlaytimeMinutes,
    count: runs.length,
    bestRating,
    completion,
  };
}
