import { getGamesByIds, JournalService } from "@/data-access-layer/services";
import type { Metadata } from "next";

import { TimelineView } from "@/features/timeline/index.server";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const metadata: Metadata = {
  title: "Timeline",
  description: "Your gaming memories, grouped by the weeks you played.",
};

const TIMELINE_LIMIT = 200;

export default async function TimelinePage() {
  const userId = await requireServerUserId();

  const journalService = new JournalService();
  const entriesResult = await journalService.findJournalEntriesByUserId({
    userId,
    limit: TIMELINE_LIMIT,
  });

  if (!entriesResult.success) {
    return (
      <div className="py-3xl container mx-auto">
        <div className="space-y-xl">
          <header>
            <h1 className="heading-xl tracking-tight">Timeline</h1>
            <p className="body-md text-muted-foreground">
              Your gaming memories, grouped by the weeks you played.
            </p>
          </header>
          <div className="space-y-lg border-border/50 bg-muted/10 p-3xl flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <p className="body-sm text-muted-foreground">
              Failed to load timeline. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const entries = entriesResult.data;

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

  const gamesResult = gameIds.length > 0 ? await getGamesByIds(gameIds) : null;
  const games = gamesResult?.success ? gamesResult.data : [];
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
          <h1 className="heading-xl tracking-tight">Timeline</h1>
          <p className="body-md text-muted-foreground">
            Your gaming memories, grouped by the weeks you played.
          </p>
        </header>
        <TimelineView entries={entries} games={gameRecord} />
      </div>
    </div>
  );
}
