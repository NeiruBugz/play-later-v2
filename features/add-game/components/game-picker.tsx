import { useIGDBSearch } from "@/features/search";
import { Button, Input } from "@/shared/components";
import { IgdbImage } from "@/shared/components/igdb-image";
import { Label } from "@/shared/components/label";
import { cn } from "@/shared/lib";
import { SearchResponse } from "@/shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { Gamepad2, Search, X } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

type GamePreviewItemProps = {
  game: SearchResponse;
  type: "listitem" | "block";
  repickGame?: () => void;
};

function GamePreviewItem({ game, type }: GamePreviewItemProps) {
  if (type === "listitem") {
    const firstReleaseDate = game.release_dates?.[0].human.slice(-4);
    return (
      <div className="flex w-full items-center gap-3">
        <div className="shrink-0">
          <IgdbImage
            alt={`${game.name} cover art`}
            className="rounded-sm"
            gameTitle={game.name}
            coverImageId={game.cover.image_id}
            igdbSrcSize={"thumb"}
            igdbImageSize={"micro"}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-foreground">
              {game.name}
            </span>
            {firstReleaseDate && (
              <span className="shrink-0 text-sm text-muted-foreground">
                ({firstReleaseDate})
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (type === "block") {
    const firstReleaseDate = game.release_dates?.[0].human;
    return (
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <IgdbImage
            alt={`${game.name} cover art`}
            className="rounded-lg shadow-sm"
            gameTitle={game.name}
            coverImageId={game.cover.image_id}
            igdbSrcSize={"hd"}
            igdbImageSize={"micro"}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h3 className="truncate text-lg font-semibold text-foreground">
            {game.name}
          </h3>
          {firstReleaseDate && (
            <p className="text-sm text-muted-foreground">
              Release date: {firstReleaseDate}
            </p>
          )}
        </div>
      </div>
    );
  }
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span className="text-sm">Searching games...</span>
      </div>
    </div>
  );
}

function EmptyState({ searchValue }: { searchValue: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <Gamepad2 className="mb-3 h-8 w-8 text-muted-foreground/50" />
      <h4 className="mb-1 text-sm font-medium text-muted-foreground">
        No games found
      </h4>
      <p className="text-xs text-muted-foreground">
        Try searching for &quot;{searchValue}&quot; with different keywords
      </p>
    </div>
  );
}

type GamePickerProps = {
  onGameSelect: (game: SearchResponse) => void;
  clearSelection: () => void;
  selectedGame?: SearchResponse;
  disabled?: boolean;
};

export function GamePicker({
  onGameSelect,
  selectedGame,
  clearSelection,
  disabled = false,
}: GamePickerProps) {
  const [searchValue, setSearchValue] = useState<string>("");
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const { data, isFetching } = useIGDBSearch(searchValue);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!searchValue || searchValue?.length < 3) {
      return;
    }
  }, [searchValue]);

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const {
        currentTarget: { value },
      } = event;
      queryClient.cancelQueries({ queryKey: ["search", searchValue] });
      setSearchValue(value);
    },
    [queryClient, searchValue]
  );

  const onListItemClick = useCallback(
    (game: SearchResponse) => {
      onGameSelect(game);
      setSearchValue("");
      setIsInputFocused(false);
      queryClient.invalidateQueries({ queryKey: ["search", searchValue] });
    },
    [onGameSelect, queryClient, searchValue]
  );

  const clearSearch = useCallback(() => {
    setSearchValue("");
    setIsInputFocused(false);
    queryClient.cancelQueries({ queryKey: ["search", searchValue] });
  }, [queryClient, searchValue]);

  const isPopoverOpen = useMemo(() => {
    if (!searchValue || searchValue.length < 3) {
      return false;
    }

    if (isFetching) {
      return true;
    }

    return data !== undefined;
  }, [isFetching, data, searchValue]);

  const showResults = data && data.length > 0;
  const showEmptyState =
    data && data.length === 0 && !isFetching && searchValue.length >= 3;

  if (selectedGame) {
    return (
      <div className="space-y-3">
        <Label className="text-base font-medium">Selected Game</Label>
        <div className="relative rounded-lg border-2 border-primary/20 bg-accent/50 p-4">
          <div className="absolute -right-2 -top-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <GamePreviewItem
                game={selectedGame}
                type="block"
                repickGame={clearSelection}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="shrink-0"
              disabled={disabled}
            >
              <X className="mr-1 h-4 w-4" />
              Change
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="game-search" className="text-base font-medium">
        Search for a game
      </Label>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoComplete="off"
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
            value={searchValue}
            placeholder="Type at least 3 characters to search..."
            onChange={onInputChange}
            className={cn("h-11 pl-10 pr-10 transition-all duration-200", {
              "rounded-b-none border-b-0 ring-2 ring-ring":
                isPopoverOpen && isInputFocused,
              "ring-2 ring-ring": isInputFocused && !isPopoverOpen,
            })}
            id="game-search"
            disabled={disabled}
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0 hover:bg-muted"
              onClick={clearSearch}
              type="button"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div
          className={cn(
            "absolute top-full z-50 w-full overflow-hidden rounded-md rounded-t-none border border-input bg-background shadow-lg transition-all duration-200",
            {
              "invisible translate-y-1 opacity-0": !isPopoverOpen,
              "visible translate-y-0 opacity-100": isPopoverOpen,
            }
          )}
        >
          {isFetching && <LoadingSpinner />}

          {showResults && (
            <div className="max-h-80 overflow-y-auto">
              <ul className="divide-y divide-border">
                {data.map((searchItem, index) => (
                  <li key={searchItem.id}>
                    <button
                      type="button"
                      className="w-full p-3 text-left transition-colors duration-150 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                      onClick={() => onListItemClick(searchItem)}
                    >
                      <GamePreviewItem type="listitem" game={searchItem} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showEmptyState && <EmptyState searchValue={searchValue} />}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Search for games by title. Results from IGDB database.
      </p>
    </div>
  );
}
