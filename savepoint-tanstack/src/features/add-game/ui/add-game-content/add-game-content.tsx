import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { SearchResponseItem } from "@/shared/api/igdb";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";

import { searchGamesFn } from "../../api/search-games-fn";
import { QuickAddButton } from "../quick-add-button";
import type { AddGameContentProps } from "./add-game-content.type";

function SearchResultRow({ game }: { game: SearchResponseItem }) {
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
        <p className="truncate text-sm font-medium">{game.name}</p>
        {releaseYear !== null ? (
          <p className="text-muted-foreground text-xs tabular-nums">
            {releaseYear}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">
        <QuickAddButton igdbId={game.id} gameTitle={game.name} />
      </div>
    </li>
  );
}

export function AddGameContent({ onAdded }: AddGameContentProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponseItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  void onAdded;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length === 0) return;

    setIsSearching(true);
    setSearched(true);

    try {
      const result = await searchGamesFn({ data: { name: trimmed } });
      setResults(result.games);
    } finally {
      setIsSearching(false);
    }
  };

  const showEmpty =
    !isSearching && searched && results !== null && results.length === 0;
  const showResults = !isSearching && results !== null && results.length > 0;

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

      {isSearching ? (
        <p
          role="status"
          aria-live="polite"
          className="text-muted-foreground text-sm"
        >
          Searching...
        </p>
      ) : null}

      {showEmpty ? (
        <p className="text-muted-foreground text-sm">No results found</p>
      ) : null}

      {showResults ? (
        <section aria-label="IGDB results">
          <p className="terminal-label mb-3">// IGDB RESULTS</p>
          <ul className="gap-sm flex flex-col">
            {results!.map((game) => (
              <SearchResultRow key={game.id} game={game} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
