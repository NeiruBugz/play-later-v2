import { GameService, JournalService } from "@/data-access-layer/services";

import { JournalTimeline } from "@/features/journal/ui/journal-timeline";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const userId = await requireServerUserId();

  const journalService = new JournalService();
  const entriesResult = await journalService.findJournalEntriesByUserId({
    userId,
    limit: 20,
  });

  if (!entriesResult.success) {
    return (
      <main className="py-3xl container mx-auto">
        <div className="space-y-3xl">
          <header>
            <h1 className="heading-xl font-serif">My Journal</h1>
            <p className="body-md text-muted-foreground">
              Document your gaming journey
            </p>
          </header>
          <div className="space-y-lg border-border/50 bg-muted/10 p-3xl flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <p className="body-sm text-muted-foreground">
              Failed to load journal entries. Please try again later.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const entries = entriesResult.data;

  const gameIds =
    entries.length > 0
      ? [...new Set(entries.map((entry) => entry.gameId))]
      : [];

  const gameService = new GameService();
  const gamesResult = await gameService.getGamesByIds({ ids: gameIds });

  const games = gamesResult.success ? gamesResult.data : [];
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
    <main className="py-3xl container mx-auto">
      <div className="space-y-3xl">
        <header>
          <h1 className="heading-xl font-serif">My Journal</h1>
          <p className="body-md text-muted-foreground">
            Document your gaming journey
          </p>
        </header>

        <JournalTimeline initialEntries={entries} initialGames={gameRecord} />
      </div>
    </main>
  );
}
