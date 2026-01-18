"use client";

import { memo, useMemo } from "react";

import { Button } from "@/shared/components/ui/button";

import { useGameSearch } from "../hooks/use-game-search";
import { useLibraryStatus } from "../hooks/use-library-status";
import { useViewPreference } from "../hooks/use-view-preference";
import type { SearchGameResultWithStatus } from "../types";
import { GameCard } from "./game-card";
import { GameGridCard } from "./game-grid-card";
import type { GameSearchResultsProps } from "./game-search-results.types";
import { ViewToggle } from "./view-toggle";

export const GameSearchResults = memo(function GameSearchResults({
  query,
  userId,
}: GameSearchResultsProps) {
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage } =
    useGameSearch(query);

  const [view, setView] = useViewPreference();

  const games = useMemo(
    () => data?.pages.flatMap((page) => page.games) ?? [],
    [data]
  );

  const igdbIds = useMemo(() => games.map((game) => game.id), [games]);

  const { statusMap } = useLibraryStatus(igdbIds, !!userId);

  const gamesWithStatus: SearchGameResultWithStatus[] = useMemo(
    () =>
      games.map((game) => ({
        ...game,
        libraryStatus: statusMap[game.id] ?? null,
      })),
    [games, statusMap]
  );
  if (isLoading) {
    return (
      <div
        className={
          view === "list"
            ? "gap-lg flex flex-col"
            : "gap-xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        }
        role="status"
        aria-label="Loading search results"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={
              view === "list"
                ? "bg-muted h-36 animate-pulse rounded-lg"
                : "bg-muted aspect-[3/4] animate-pulse rounded-lg"
            }
          />
        ))}
      </div>
    );
  }
  if (isError) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Game search is temporarily unavailable. Please try again later.";
    const isRateLimitError = errorMessage.includes("Rate limit exceeded");
    return (
      <div className="text-destructive border-destructive/20 bg-destructive/5 p-2xl rounded-lg border">
        <p className="font-medium">
          {isRateLimitError ? "Rate limit exceeded" : "Search unavailable"}
        </p>
        <p className="body-sm text-muted-foreground mt-sm">
          {isRateLimitError
            ? "You've reached the search limit. Please try again later."
            : errorMessage}
        </p>
      </div>
    );
  }

  if (gamesWithStatus.length === 0) {
    return (
      <div className="text-muted-foreground border-border/30 bg-muted/30 p-2xl rounded-lg border text-center">
        No games found matching &quot;{query}&quot;. Try a different search
        term.
      </div>
    );
  }

  return (
    <div className="space-y-3xl" aria-live="polite" aria-atomic="false">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground body-sm">
          {gamesWithStatus.length} result
          {gamesWithStatus.length !== 1 ? "s" : ""}
        </p>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {view === "list" ? (
        <div className="gap-lg flex flex-col">
          {gamesWithStatus.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="gap-xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {gamesWithStatus.map((game) => (
            <GameGridCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="pt-md flex justify-center">
          <Button onClick={() => fetchNextPage()} variant="outline" size="lg">
            Load More Results
          </Button>
        </div>
      )}
    </div>
  );
});
