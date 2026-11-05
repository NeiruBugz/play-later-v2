import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { AddGameAction } from "@/features/add-game";
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
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Search Games
          </h1>
          <p className="text-muted-foreground text-sm">
            Find games to add to your SavePoint library
          </p>
        </div>
        <div className="space-y-8">
          <SearchGamesInput initialQuery={query} />
          {query.length === 0 ? (
            <p
              role="status"
              className="text-muted-foreground border-border/30 bg-muted/30 rounded-lg border p-6 text-center"
            >
              Start typing to search for games...
            </p>
          ) : (
            <SearchGamesResults
              query={query}
              renderAddAction={({ igdbId, name }) => (
                <AddGameAction game={{ igdbId, name, library: null }} />
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
