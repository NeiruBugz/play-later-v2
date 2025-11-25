"use client";

import { Button } from "@/shared/components/ui/button";

import { useGameSearch } from "../hooks/use-game-search";
import { GameCard } from "./game-card";
import type { GameSearchResultsProps } from "./game-search-results.types";

export const GameSearchResults = ({ query }: GameSearchResultsProps) => {
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage } =
    useGameSearch(query);
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 gap-xl md:grid-cols-2 lg:grid-cols-3"
        role="status"
        aria-label="Loading search results"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-muted h-36 animate-pulse rounded-lg" />
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
      <div className="text-destructive border-destructive/20 bg-destructive/5 rounded-lg border p-2xl">
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
  const games = data?.pages.flatMap((page) => page.games) ?? [];
  if (games.length === 0) {
    return (
      <div className="text-muted-foreground border-border/30 bg-muted/30 rounded-lg border p-2xl text-center">
        No games found matching &quot;{query}&quot;. Try a different search
        term.
      </div>
    );
  }
  return (
    <div className="space-y-3xl" aria-live="polite" aria-atomic="false">
      <div className="flex flex-col gap-lg">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
      {hasNextPage && (
        <div className="flex justify-center pt-md">
          <Button onClick={() => fetchNextPage()} variant="outline" size="lg">
            Load More Results
          </Button>
        </div>
      )}
    </div>
  );
};
