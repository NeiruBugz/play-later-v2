"use client";

import { AlertCircle, Loader2 } from "lucide-react";

import { ScrollArea } from "@/shared/components/ui/scroll-area";

import { GameSearchResultsProps } from "../lib/types";
import { GameSearchResultCard } from "./game-search-result-card";

export function GameSearchResults({
  games,
  isLoading,
  isFetching,
  isError,
  error,
  query,
  onGameSelect,
}: GameSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="text-muted-foreground mb-4 h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Searching for games...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
        <AlertCircle className="mb-4 h-8 w-8 text-red-600 dark:text-red-400" />
        <p className="mb-2 font-semibold text-red-900 dark:text-red-100">
          Search failed
        </p>
        <p className="text-muted-foreground text-sm">
          {error?.message || "Unable to search games. Please try again."}
        </p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground mb-2 text-sm font-medium">
          No games found
        </p>
        <p className="text-muted-foreground text-xs">
          Try a different search term for &quot;{query}&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-3">
      {isFetching && (
        <div className="absolute top-2 right-2 z-10">
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        </div>
      )}
      <p className="text-muted-foreground text-sm">
        Found {games.length} {games.length === 1 ? "game" : "games"}
      </p>
      <ScrollArea className="h-[600px] pr-4">
        <div className="grid gap-3">
          {games.map((game) => (
            <GameSearchResultCard
              key={game.id}
              game={game}
              onSelect={() => onGameSelect(game)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
