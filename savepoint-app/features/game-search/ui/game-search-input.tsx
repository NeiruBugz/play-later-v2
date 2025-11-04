"use client";

import { useState } from "react";

import { Input } from "@/shared/components/ui/input";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

import { GameSearchResults } from "./game-search-results";

export const GameSearchInput = () => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);

  return (
    <div className="space-y-8">
      <Input
        type="search"
        placeholder="Search for games (minimum 3 characters)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search for games by name"
        className="h-12 text-base"
      />

      {debouncedQuery.length >= 3 && (
        <GameSearchResults query={debouncedQuery} />
      )}
    </div>
  );
};
