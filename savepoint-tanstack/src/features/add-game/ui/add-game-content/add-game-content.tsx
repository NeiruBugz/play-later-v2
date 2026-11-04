import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import type { LibraryAwareSearchItem as SearchResultGame } from "@/entities/library-item/api/search-library-aware-games.worker";
import { MIN_GAME_SEARCH_QUERY_LENGTH } from "@/shared/lib/game-search";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";

import { searchGamesFn } from "../../api/search-games-fn";
import { AddGameAction } from "../add-game-action";
import type { AddGameContentProps } from "./add-game-content.type";

type SearchState =
  | { phase: "idle" }
  | { phase: "searching" }
  | { phase: "error" }
  | { phase: "done"; games: SearchResultGame[] };

function SearchResultRow({ game }: { game: SearchResultGame }) {
  const coverUrl = buildCoverImageUrl(
    game.cover?.image_id ?? null,
    "t_cover_small"
  );
  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : null;

  return (
    <li className="flex items-center gap-3">
      <div className="shrink-0">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`Cover for ${game.name}`}
            loading="lazy"
            className="shadow-paper aspect-[3/4] w-10 rounded object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label={`Cover for ${game.name}`}
            className="bg-muted shadow-paper aspect-[3/4] w-10 rounded"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Link
          to="/games/$slug"
          params={{ slug: game.slug }}
          className="block truncate text-sm font-medium"
        >
          {game.name}
        </Link>
        {releaseYear !== null ? (
          <p className="text-muted-foreground text-xs tabular-nums">
            {releaseYear}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">
        <AddGameAction
          game={{ igdbId: game.id, name: game.name, library: game.library }}
        />
      </div>
    </li>
  );
}

export function AddGameContent({ onSeeAll }: AddGameContentProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({ phase: "idle" });
  const debouncedQuery = useDebouncedValue(query.trim());

  useEffect(() => {
    if (debouncedQuery.length < MIN_GAME_SEARCH_QUERY_LENGTH) {
      setSearch({ phase: "idle" });
      return;
    }
    let cancelled = false;
    setSearch({ phase: "searching" });
    searchGamesFn({ data: { name: debouncedQuery } })
      .then((result) => {
        if (!cancelled) setSearch({ phase: "done", games: result.games });
      })
      .catch(() => {
        if (!cancelled) setSearch({ phase: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="gap-lg flex flex-col">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Search
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute left-3 h-4 w-4"
        />
        <Input
          type="search"
          aria-label="Search games"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search games"
          className={cn("flex-1 rounded-full pl-9")}
        />
      </form>

      {search.phase === "searching" ? (
        <p
          role="status"
          aria-live="polite"
          className="text-muted-foreground text-sm"
        >
          Searching...
        </p>
      ) : null}

      {search.phase === "error" ? (
        <p role="alert" className="text-destructive text-sm">
          Search is unavailable. Try again.
        </p>
      ) : null}

      {search.phase === "done" && search.games.length === 0 ? (
        <p className="text-muted-foreground text-sm">No results found</p>
      ) : null}

      {search.phase === "done" && search.games.length > 0 ? (
        <section aria-label="Search results" className="gap-md flex flex-col">
          <ul className="gap-sm flex flex-col">
            {search.games.map((game) => (
              <SearchResultRow key={game.id} game={game} />
            ))}
          </ul>
          <Link
            to="/games/search"
            search={{ q: debouncedQuery }}
            onClick={onSeeAll}
            className="text-primary text-sm font-medium underline-offset-4 hover:underline"
          >
            See all results
          </Link>
        </section>
      ) : null}
    </div>
  );
}
