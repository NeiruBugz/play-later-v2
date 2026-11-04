import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import {
  getJournalGameOptionsFn,
  getJournalTimelinePageDataFn,
} from "@/features/journal-timeline";
import { JournalTimelinePage } from "@/widgets/journal-timeline-page";

/**
 * `gameId` is the Journal filter: a game id, `none` for notes without a game,
 * or absent for all notes. It is not `game`, which the global Log form owns.
 */
const searchSchema = z.object({
  gameId: z.string().min(1).optional(),
});

export const Route = createFileRoute("/_authed/journal/")({
  validateSearch: (input) => searchSchema.parse(input),
  loaderDeps: ({ search }) => ({ gameId: search.gameId }),
  loader: async ({ deps }) => {
    const [entries, gameOptions] = await Promise.all([
      getJournalTimelinePageDataFn({ data: { gameId: deps.gameId } }),
      getJournalGameOptionsFn(),
    ]);
    return { entries, gameOptions };
  },
  component: JournalPage,
});

function JournalPage() {
  const { entries, gameOptions } = Route.useLoaderData();
  const { gameId } = Route.useSearch();

  return (
    <main className="container mx-auto px-4 py-6">
      <JournalTimelinePage
        entries={entries}
        gameOptions={gameOptions}
        selectedGame={gameId}
      />
    </main>
  );
}
