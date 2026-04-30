import { getGamesByIds, JournalService } from "@/data-access-layer/services";

import { JournalTimeline } from "@/features/journal";
import { requireServerUserId } from "@/shared/lib/app/auth";

export default async function JournalPage() {
  const userId = await requireServerUserId();

  const journalService = new JournalService();
  const entries = await journalService.findJournalEntriesByUserId({
    userId,
    limit: 20,
  });

  const gameIds =
    entries.length > 0
      ? [
          ...new Set(
            entries
              .map((entry) => entry.gameId)
              .filter((id): id is string => id !== null)
          ),
        ]
      : [];

  const games =
    gameIds.length > 0
      ? await getGamesByIds(gameIds)
      : ([] as Awaited<ReturnType<typeof getGamesByIds>>);
  const gameRecord: Record<
    string,
    { id: string; title: string; slug: string; coverImage: string | null }
  > = {};

  games.forEach((game) => {
    gameRecord[game.id] = {
      id: game.id,
      title: game.title,
      slug: game.slug,
      coverImage: game.coverImage,
    };
  });

  return (
    <div className="py-3xl container mx-auto">
      <div className="space-y-3xl">
        <header>
          <h1 className="heading-xl tracking-tight">Journal</h1>
          <p className="body-md text-muted-foreground">
            Your sessions and reflections, tied to the games you played them
            for.
          </p>
        </header>

        <JournalTimeline initialEntries={entries} initialGames={gameRecord} />
      </div>
    </div>
  );
}
