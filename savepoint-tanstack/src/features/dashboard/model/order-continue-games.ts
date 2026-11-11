type ContinueCandidate = {
  game: { title: string };
  lastSessionAt: Date | null;
  becamePlayingAt: Date | null;
};

const millisOrZero = (date: Date | null) => date?.getTime() ?? 0;

const recencyMillis = (item: ContinueCandidate) =>
  millisOrZero(item.lastSessionAt ?? item.becamePlayingAt);

export function orderContinueGames<T extends ContinueCandidate>(
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) =>
      recencyMillis(b) - recencyMillis(a) ||
      millisOrZero(b.becamePlayingAt) - millisOrZero(a.becamePlayingAt) ||
      a.game.title.localeCompare(b.game.title)
  );
}
