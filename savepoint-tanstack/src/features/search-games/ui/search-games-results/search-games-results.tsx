import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { LibraryStatusBadge, QueueMarker } from "@/entities/library-item";
import { searchLibraryAwareGamesFn } from "@/features/search-games/api/search-library-aware-games";
import type { LibraryAwareSearchResult } from "@/features/search-games/api/search-library-aware-games.worker";
import { MIN_GAME_SEARCH_QUERY_LENGTH } from "@/shared/lib/game-search";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { RatingInput } from "@/shared/ui/rating-input";

import type { SearchGamesResultsProps } from "./search-games-results.type";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Fetches library-aware search results for `query` and renders a grid of
 * cards. Results the viewer already owns show their library status (and rating
 * when set) and skip the add affordance; unowned results render the
 * route-injected `renderAddAction` slot. (F08)
 */
export function SearchGamesResults({
  query,
  renderAddAction,
}: SearchGamesResultsProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<LibraryAwareSearchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < MIN_GAME_SEARCH_QUERY_LENGTH) {
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
        const data = await searchLibraryAwareGamesFn({
          data: { name: query },
        });
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

  if (query.length < MIN_GAME_SEARCH_QUERY_LENGTH) {
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
          className="h-6 w-6 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-destructive"
      >
        <p className="font-medium">Search unavailable</p>
        <p className="mt-1.5 text-base text-muted-foreground md:text-sm">
          {errorMessage}
        </p>
      </div>
    );
  }

  const games = result?.games ?? [];
  const ownedCount = result?.ownedCount ?? 0;

  if (status === "success" && games.length === 0) {
    return (
      <div
        role="status"
        className="rounded-lg border border-border/30 bg-muted/30 p-6 text-center text-muted-foreground"
      >
        No games found matching &ldquo;{query}&rdquo;. Try a different search
        term.
      </div>
    );
  }

  return (
    <div aria-live="polite" aria-atomic="false" className="space-y-8">
      <p className="text-base text-muted-foreground md:text-sm">
        {games.length} result{games.length !== 1 ? "s" : ""}
        {ownedCount > 0 ? (
          <>
            {" · "}
            <span className="font-medium text-foreground">
              {ownedCount} in your library
            </span>
          </>
        ) : null}
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
          const owned = game.library !== null;
          return (
            <li key={game.id} className="relative">
              <Link
                to="/games/$slug"
                params={{ slug: game.slug }}
                className="block space-y-1"
              >
                <div className="relative">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={`Cover for ${game.name}`}
                      loading="lazy"
                      className="aspect-[3/4] w-full overflow-hidden rounded-lg object-cover shadow-md"
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={`Cover for ${game.name}`}
                      className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted shadow-md"
                    />
                  )}
                  {game.library !== null ? (
                    <div className="absolute top-1 left-1">
                      <LibraryStatusBadge status={game.library.status} />
                    </div>
                  ) : null}
                  {!owned && renderAddAction ? (
                    // Add affordance overlays the cover bottom-right. It sits
                    // inside the navigating <Link>; the bubble-phase handler
                    // stops the click from reaching the link so a tap adds the
                    // game without navigating to its detail page.
                    <div
                      className="absolute right-1.5 bottom-1.5"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    >
                      {renderAddAction({ igdbId: game.id, name: game.name })}
                    </div>
                  ) : null}
                </div>
                <p className="truncate text-base font-medium md:text-sm">
                  {game.name}
                </p>
                {game.library !== null ? (
                  <QueueMarker
                    status={game.library.status}
                    upNextPosition={game.library.upNextPosition}
                  />
                ) : null}
                <div className="flex h-4 items-center gap-1">
                  {releaseYear !== null && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {releaseYear}
                    </span>
                  )}
                  {game.library !== null && game.library.rating !== null ? (
                    <RatingInput
                      value={game.library.rating}
                      size="sm"
                      readOnly
                      aria-label={`Your rating: ${game.library.rating / 2} out of 5 stars`}
                    />
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
