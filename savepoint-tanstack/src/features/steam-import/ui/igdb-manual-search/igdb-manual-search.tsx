import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { searchGamesFn } from "@/features/add-game/api/search-games-fn";
import type { SearchResponseItem } from "@/shared/api/igdb";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

import type { IgdbManualSearchProps } from "./igdb-manual-search.type";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;
const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";

function getCoverUrl(imageId: string | undefined | null): string {
  if (!imageId) return "";
  return `${IGDB_IMAGE_BASE}/t_cover_small/${imageId}.jpg`;
}

function getReleaseYear(timestamp: number | null | undefined): string {
  if (!timestamp) return "Unknown";
  return new Date(timestamp * 1000).getFullYear().toString();
}

function getPlatformLabel(platforms: SearchResponseItem["platforms"]): string {
  if (!platforms || platforms.length === 0) return "Unknown";
  return platforms
    .slice(0, 3)
    .map((p) => p.abbreviation ?? p.name)
    .join(", ");
}

/**
 * Manual IGDB picker for unmatched imported games (Slice 21 IGDB-linking
 * follow-up).
 *
 * Pure picker — no Dialog wrapper, parent owns the modal shell.
 * Debounces the input (300ms), calls `searchGamesFn`, and emits
 * `onSelect(igdbId)` when the user picks a result.
 */
export function IgdbManualSearch({
  onSelect,
  isLoading = false,
}: IgdbManualSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResponseItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (debouncedQuery.length < MIN_QUERY_LENGTH) {
        setResults([]);
        setError(null);
        return;
      }
      setIsSearching(true);
      setError(null);
      try {
        const data = await searchGamesFn({ data: { name: debouncedQuery } });
        if (cancelled) return;
        setResults(data.games);
      } catch {
        if (cancelled) return;
        setError("Failed to search games. Please try again.");
        setResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const showNoResults =
    !isSearching &&
    !error &&
    debouncedQuery.length >= MIN_QUERY_LENGTH &&
    results.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search
          className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="text"
          placeholder="Search IGDB for the correct game…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
          disabled={isLoading}
          aria-label="IGDB search query"
        />
      </div>

      {isSearching ? (
        <div
          className="text-muted-foreground flex items-center justify-center py-8"
          role="status"
          aria-live="polite"
        >
          <span>Searching…</span>
        </div>
      ) : null}

      {error ? (
        <div
          className="text-destructive flex items-center justify-center py-4 text-sm"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {showNoResults ? (
        <div className="text-muted-foreground flex items-center justify-center py-8">
          No games found
        </div>
      ) : null}

      {results.length > 0 ? (
        <ul
          className="flex max-h-80 flex-col gap-2 overflow-y-auto"
          role="list"
          aria-label="IGDB search results"
        >
          {results.map((game) => {
            const coverUrl = getCoverUrl(game.cover?.image_id);
            const year = getReleaseYear(game.first_release_date);
            const platforms = getPlatformLabel(game.platforms);
            return (
              <li key={game.id}>
                <Card className="hover:bg-muted/20">
                  <CardContent className="flex items-center gap-3 p-3">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={`Cover for ${game.name}`}
                        className="h-12 w-10 shrink-0 rounded object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="bg-muted flex h-12 w-10 shrink-0 items-center justify-center rounded">
                        <span className="text-muted-foreground text-xs font-medium">
                          {game.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium">{game.name}</h3>
                      <div className="text-muted-foreground flex gap-2 text-sm">
                        <span>{year}</span>
                        <span aria-hidden>•</span>
                        <span className="truncate">{platforms}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onSelect(game.id)}
                      disabled={isLoading}
                      aria-label={`Select ${game.name}`}
                    >
                      Select
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
