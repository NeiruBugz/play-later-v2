"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Gamepad2, Search, X } from "lucide-react";
import { useMemo, useState, type ChangeEvent } from "react";

import { IgdbImage } from "@/shared/components/igdb-image";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useIGDBSearch } from "@/shared/hooks/use-igdb-search";
import { cn } from "@/shared/lib";
import { type SearchResponse } from "@/shared/types";

const YEAR_SLICE_LENGTH = -4;
const MIN_QUERY_LENGTH = 3;
const INPUT_BLUR_TIMEOUT_MS = 200;

type GamePreviewItemProps = {
  game: SearchResponse;
  type: "listitem" | "block";
  repickGame?: () => void;
};

function ReleaseDate({ releaseDate }: { releaseDate: string | undefined }) {
  if (releaseDate === undefined) {
    return null;
  }

  return (
    <span className="shrink-0 text-sm text-muted-foreground">
      ({releaseDate})
    </span>
  );
}

function GamePreviewItem({ game, type }: GamePreviewItemProps) {
  const firstReleaseDate =
    type === "listitem"
      ? game.release_dates?.[0].human.slice(YEAR_SLICE_LENGTH)
      : game.release_dates?.[0].human;

  if (type === "listitem") {
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
            <ReleaseDate releaseDate={firstReleaseDate} />
          </div>
        </div>
      </div>
    );
  }

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
        <ReleaseDate releaseDate={firstReleaseDate} />
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span className="text-sm">Searching games...</span>
      </div>
    </div>
  );
}

function EmptyState({ searchValue }: { searchValue: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <Gamepad2 className="mb-3 size-8 text-muted-foreground/50" />
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
  onGameSelectAction: (game: SearchResponse) => void;
  clearSelectionAction: () => void;
  selectedGame?: SearchResponse;
  disabled?: boolean;
};

export function GamePicker({
  onGameSelectAction,
  selectedGame,
  clearSelectionAction,
  disabled = false,
}: GamePickerProps) {
  const [searchValue, setSearchValue] = useState<string>("");
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const { data, isFetching } = useIGDBSearch(searchValue);
  const queryClient = useQueryClient();

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const {
      currentTarget: { value },
    } = event;
    void queryClient.cancelQueries({ queryKey: ["search", searchValue] });
    setSearchValue(value);
  };

  const onListItemClick = (game: SearchResponse) => {
    onGameSelectAction(game);
    setSearchValue("");
    setIsInputFocused(false);
    void queryClient.invalidateQueries({
      queryKey: ["search", searchValue],
    });
  };

  const clearSearch = () => {
    setSearchValue("");
    setIsInputFocused(false);
    void queryClient.cancelQueries({ queryKey: ["search", searchValue] });
  };

  const isPopoverOpen = useMemo(() => {
    if (!searchValue || searchValue.length < MIN_QUERY_LENGTH) {
      return false;
    }

    if (isFetching) {
      return true;
    }

    return data !== undefined;
  }, [isFetching, data, searchValue]);

  const onInputBlur = () => {
    setTimeout(() => {
      setIsInputFocused(false);
    }, INPUT_BLUR_TIMEOUT_MS);
  };

  const showResults = data && data.length > 0;
  const showEmptyState =
    data &&
    data.length === 0 &&
    !isFetching &&
    searchValue.length >= MIN_QUERY_LENGTH;

  if (selectedGame) {
    return (
      <div className="space-y-3">
        <Label className="text-base font-medium">Selected Game</Label>
        <div className="relative rounded-lg border-2 border-primary/20 bg-accent/50 p-4">
          <div className="absolute -right-2 -top-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
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
                repickGame={clearSelectionAction}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelectionAction}
              className="shrink-0"
              disabled={disabled}
            >
              <X className="mr-1 size-4" />
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
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoComplete="off"
            onFocus={() => {
              setIsInputFocused(true);
            }}
            onBlur={onInputBlur}
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
              className="absolute right-1 top-1/2 size-8 -translate-y-1/2 p-0 hover:bg-muted"
              onClick={clearSearch}
              type="button"
              disabled={disabled}
            >
              <X className="size-4" />
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

          {showResults === true && (
            <div className="max-h-80 overflow-y-auto">
              <ul className="divide-y divide-border">
                {data.map((searchItem) => (
                  <li key={searchItem.id}>
                    <button
                      type="button"
                      className="w-full p-3 text-left transition-colors duration-150 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                      onClick={() => {
                        onListItemClick(searchItem);
                      }}
                    >
                      <GamePreviewItem type="listitem" game={searchItem} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showEmptyState === true && <EmptyState searchValue={searchValue} />}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Search for games by title. Results from IGDB database.
      </p>
    </div>
  );
}
