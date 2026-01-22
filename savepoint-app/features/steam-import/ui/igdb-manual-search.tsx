"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import type { SearchResponse } from "@/shared/types";

type IgdbManualSearchProps = {
  onSelect: (igdbId: number) => void;
  isLoading?: boolean;
};

type SearchResult = {
  games: SearchResponse[];
  count: number;
};

function getImageUrl(imageId: string | undefined): string {
  if (!imageId) {
    return "";
  }
  return `https://images.igdb.com/igdb/image/upload/t_cover_small/${imageId}.jpg`;
}

function getReleaseYear(timestamp: number | undefined): string {
  if (!timestamp) {
    return "Unknown";
  }
  return new Date(timestamp * 1000).getFullYear().toString();
}

function getPlatformNames(platforms: SearchResponse["platforms"]): string {
  if (!platforms || platforms.length === 0) {
    return "Unknown";
  }
  return platforms
    .slice(0, 3)
    .map((p) => p.abbreviation ?? p.name)
    .join(", ");
}

export function IgdbManualSearch({
  onSelect,
  isLoading = false,
}: IgdbManualSearchProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    const searchGames = async () => {
      if (debouncedQuery.length < 3) {
        setSearchResults([]);
        setError(null);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/games/search?q=${encodeURIComponent(debouncedQuery)}&offset=0`
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data: SearchResult = await response.json();
        setSearchResults(data.games);
      } catch {
        setError("Failed to search games. Please try again.");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    void searchGames();
  }, [debouncedQuery]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="Search IGDB for the correct game..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
          disabled={isLoading}
        />
      </div>

      {isSearching && (
        <div className="text-muted-foreground flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            <span>Searching...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="text-destructive flex items-center justify-center py-4 text-sm">
          {error}
        </div>
      )}

      {!isSearching &&
        !error &&
        debouncedQuery.length >= 3 &&
        searchResults.length === 0 && (
          <div className="text-muted-foreground flex items-center justify-center py-8">
            No games found
          </div>
        )}

      {searchResults.length > 0 && (
        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
          {searchResults.map((game) => {
            const imageUrl = getImageUrl(game.cover?.image_id);
            const releaseYear = getReleaseYear(game.first_release_date);
            const platforms = getPlatformNames(game.platforms);

            return (
              <Card
                key={game.id}
                variant="default"
                className="hover:bg-muted/20"
              >
                <CardContent
                  spacing="compact"
                  className="flex items-center gap-3"
                >
                  {imageUrl ? (
                    <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded">
                      <Image
                        src={imageUrl}
                        alt={game.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
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
                      <span>{releaseYear}</span>
                      <span>•</span>
                      <span className="truncate">{platforms}</span>
                    </div>
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onSelect(game.id)}
                    disabled={isLoading}
                    loading={isLoading}
                  >
                    Select
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
