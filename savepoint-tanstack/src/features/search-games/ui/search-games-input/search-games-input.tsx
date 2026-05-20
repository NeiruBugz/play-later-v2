import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { Input } from "@/shared/ui/input";

import type { SearchGamesInputProps } from "./search-games-input.type";

/**
 * Debounced search input that drives URL state via `?q=`. Deep-linkable; no
 * local state for the query — the parent route reads `q` from the URL and
 * passes it down via `initialQuery`. Mirrors canonical
 * `features/game-search/ui/game-search-input.tsx`.
 */
export function SearchGamesInput({
  initialQuery,
  debounceMs = 300,
}: SearchGamesInputProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const debounced = useDebouncedValue(query, debounceMs);

  useEffect(() => {
    if (debounced === initialQuery) return;
    void navigate({
      to: "/games/search",
      search: debounced ? { q: debounced } : {},
      replace: true,
    });
  }, [debounced, navigate]);

  return (
    <Input
      type="search"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search for games (minimum 3 characters)..."
      aria-label="Search for games by name"
      className="body-md h-12"
    />
  );
}
