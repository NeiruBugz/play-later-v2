"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { SearchResponse } from "@/shared/types";

import { useSearchGamesByName } from "../hooks/use-search-games-by-name";
import { AddGameForm } from "./add-game-form";
import { GameSearchResults } from "./game-search-results";

const DEBOUNCE_DELAY_MS = 300;

export function GameSearchForm() {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<SearchResponse | null>(null);

  const { games, isLoading, isFetching, error, isError } =
    useSearchGamesByName(debouncedQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue);
    }, DEBOUNCE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleClear = () => {
    setInputValue("");
    setDebouncedQuery("");
  };

  const handleGameSelect = (game: SearchResponse) => {
    setSelectedGame(game);
  };

  const handleCancelForm = () => {
    setSelectedGame(null);
  };

  if (selectedGame) {
    return <AddGameForm game={selectedGame} onCancel={handleCancelForm} />;
  }

  const hasInput = inputValue.trim().length > 0;
  const showResults = hasInput && debouncedQuery.trim().length >= 3;
  const showMinLengthHint = hasInput && inputValue.trim().length < 3;
  const isTyping = inputValue !== debouncedQuery && hasInput;

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search for games... (min 3 characters)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="pr-10 pl-10"
          autoFocus
        />
        {hasInput && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showMinLengthHint && (
        <p className="text-muted-foreground text-sm">
          Type at least 3 characters to search
        </p>
      )}

      {isTyping && inputValue.trim().length >= 3 && (
        <p className="text-muted-foreground text-sm">Typing...</p>
      )}

      {showResults && (
        <GameSearchResults
          games={games}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          error={error}
          query={debouncedQuery}
          onGameSelect={handleGameSelect}
        />
      )}
    </div>
  );
}
