import { useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";

import { addGameToLibraryFn } from "../../api/add-game-to-library-fn";
import { searchGamesFn } from "../../api/search-games-fn";

import type { SearchResponseItem } from "@/shared/api/igdb";

type AddGameModalProps = {
  onAdded: () => void;
};

export function AddGameModal({ onAdded }: AddGameModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponseItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length === 0) return;

    setIsSearching(true);
    setSearched(true);
    setSelectedId(null);

    try {
      const result = await searchGamesFn({ data: { name: trimmed } });
      setResults(result.games);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async () => {
    if (selectedId == null) return;
    setIsAdding(true);
    try {
      await addGameToLibraryFn({ data: { igdbId: selectedId } });
      toast.success("Added to library");
      router.invalidate();
      onAdded();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not add game to library";
      toast.error(message);
    } finally {
      setIsAdding(false);
    }
  };

  const showEmpty =
    !isSearching && searched && results !== null && results.length === 0;
  const showResults = !isSearching && results !== null && results.length > 0;

  return (
    <div className="flex flex-col gap-lg">
      <form onSubmit={handleSubmit} className="flex gap-md">
        <Input
          type="search"
          aria-label="Search games"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search games"
          className="flex-1"
        />
      </form>

      {isSearching ? (
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          Searching...
        </p>
      ) : null}

      {showEmpty ? (
        <p className="text-sm text-muted-foreground">No results found</p>
      ) : null}

      {showResults ? (
        <ul className="flex flex-col gap-sm">
          {results!.map((game) => {
            const isSelected = selectedId === game.id;
            return (
              <li key={game.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(game.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "w-full rounded-md border border-border px-md py-sm text-left text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "hover:bg-surface-hover"
                  )}
                >
                  {game.name}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <Button
        type="button"
        onClick={handleAdd}
        disabled={selectedId === null || isAdding}
      >
        Add to library
      </Button>
    </div>
  );
}
