import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { searchGamesFn } from "@/features/search-games/api/search-games";
import type { SearchGamesResult } from "@/shared/api/igdb";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";

import type { SearchGamesResultsProps } from "./search-games-results.type";

type Status = "idle" | "loading" | "success" | "error";

const MIN_QUERY_LENGTH = 3;

/**
 * Fetches IGDB search results for `query` and renders a grid of game cards
 * linking to the detail page. Mirrors the result-list shape of canonical
 * `features/game-search/ui/game-search-results.tsx`, but without library-
 * status / view-toggle / pagination — those are scoped out of Slice 22.
 */
export function SearchGamesResults({ query }: SearchGamesResultsProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<SearchGamesResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setStatus("idle");
      setResult(null);
      setErrorMessage(null);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);
    void (async () => {
      try {
        const data = await searchGamesFn({ data: { name: query } });
        if (cancelled) return;
        setResult(data);
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Game search is temporarily unavailable. Please try again later."
        );
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  if (query.length < MIN_QUERY_LENGTH) {
    return null;
  }

  if (status === "loading") {
    return (
      <div
        role="status"
        aria-label="Loading search results"
        className="flex items-center justify-center py-12"
      >
        <Loader2
          aria-hidden="true"
          className="text-muted-foreground h-6 w-6 animate-spin"
        />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="text-destructive border-destructive/20 bg-destructive/5 p-2xl rounded-lg border"
      >
        <p className="font-medium">Search unavailable</p>
        <p className="body-sm text-muted-foreground mt-sm">{errorMessage}</p>
      </div>
    );
  }

  const games = result?.games ?? [];

  if (status === "success" && games.length === 0) {
    return (
      <div
        role="status"
        className="text-muted-foreground border-border/30 bg-muted/30 p-2xl rounded-lg border text-center"
      >
        No games found matching &ldquo;{query}&rdquo;. Try a different search
        term.
      </div>
    );
  }

  return (
    <div aria-live="polite" aria-atomic="false" className="space-y-3xl">
      <p className="text-muted-foreground body-sm">
        {games.length} result{games.length !== 1 ? "s" : ""}
      </p>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
        {games.map((game) => {
          const coverUrl = buildCoverImageUrl(
            game.cover?.image_id ?? null,
            "t_cover_big"
          );
          const releaseYear = game.first_release_date
            ? new Date(game.first_release_date * 1000).getFullYear()
            : null;
          return (
            <li key={game.id}>
              <Link
                to="/games/$slug"
                params={{ slug: game.slug }}
                className="block space-y-1"
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={`Cover for ${game.name}`}
                    loading="lazy"
                    className="shadow-paper-md aspect-[3/4] w-full overflow-hidden rounded-lg object-cover"
                  />
                ) : (
                  <div
                    role="img"
                    aria-label={`Cover for ${game.name}`}
                    className="bg-muted shadow-paper-md aspect-[3/4] w-full overflow-hidden rounded-lg"
                  />
                )}
                <p className="truncate text-sm font-medium">{game.name}</p>
                {releaseYear !== null && (
                  <p className="text-muted-foreground text-xs">{releaseYear}</p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
