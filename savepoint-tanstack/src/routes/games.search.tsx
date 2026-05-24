import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { QuickAddButton } from "@/features/add-game";
import { SearchGamesInput, SearchGamesResults } from "@/features/search-games";

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/games/search")({
  validateSearch: (input) => searchSchema.parse(input),
  component: GameSearchRoute,
});

function GameSearchRoute() {
  const { q } = Route.useSearch();
  const query = q ?? "";

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="space-y-xl">
        <div className="space-y-sm">
          <h1 className="heading-lg">Search Games</h1>
          <p className="text-muted-foreground text-sm">
            Find games to add to your SavePoint library
          </p>
        </div>
        <div className="space-y-3xl">
          <SearchGamesInput initialQuery={query} />
          {query.length === 0 ? (
            <p
              role="status"
              className="text-muted-foreground border-border/30 bg-muted/30 p-2xl rounded-lg border text-center"
            >
              Start typing to search for games...
            </p>
          ) : (
            <SearchGamesResults
              query={query}
              renderAddAction={({ igdbId, name }) => (
                <QuickAddButton igdbId={igdbId} gameTitle={name} />
              )}
            />
          )}
        </div>
      </div>
    </main>
  );
}
