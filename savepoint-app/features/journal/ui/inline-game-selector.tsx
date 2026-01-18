"use client";

import type { GetLibraryItemsResult } from "@/data-access-layer/services";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Gamepad2, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GameCoverImage } from "@/shared/components/game-cover-image";
import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";

interface InlineGameSelectorProps {
  selectedGameId: string | null;
  onGameSelect: (gameId: string) => void;
  defaultGameId?: string;
}

async function fetchUserLibraryGames(): Promise<GetLibraryItemsResult> {
  const response = await fetch("/api/library?distinctByGame=true");
  if (!response.ok) {
    throw new Error("Failed to fetch library games");
  }
  const json = await response.json();
  if ("error" in json) {
    throw new Error(json.error);
  }
  return json.data;
}

export function InlineGameSelector({
  selectedGameId,
  onGameSelect,
  defaultGameId,
}: InlineGameSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const {
    data: libraryItems,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["library-games-for-journal"],
    queryFn: fetchUserLibraryGames,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const uniqueGames = libraryItems
    ? Array.from(
        new Map(
          libraryItems.items.map((item) => [item.game.id, item.game])
        ).values()
      )
    : [];

  const selectedGame = uniqueGames.find((game) => game.id === selectedGameId);
  const defaultGame = defaultGameId
    ? uniqueGames.find((game) => game.id === defaultGameId)
    : null;

  if (isLoading) {
    return (
      <div className="bg-card/50 border-border/50 px-lg py-md flex items-center gap-3 rounded-lg border">
        <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
        <span className="text-muted-foreground text-sm">
          Loading your library...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-destructive/5 border-destructive/20 px-lg py-md space-y-sm rounded-lg border">
        <p className="text-destructive text-sm font-medium">
          Failed to load your library
        </p>
        {error instanceof Error && (
          <p className="text-destructive/80 text-xs">{error.message}</p>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => refetch()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!uniqueGames || uniqueGames.length === 0) {
    return (
      <div className="bg-muted/20 px-lg py-md space-y-sm rounded-lg border border-dashed text-center">
        <div className="gap-md flex flex-col items-center">
          <div className="bg-muted/50 flex h-12 w-12 items-center justify-center rounded-full">
            <Gamepad2 className="text-muted-foreground/60 h-6 w-6" />
          </div>
          <div className="space-y-xs">
            <p className="text-sm font-medium">No games in your library</p>
            <p className="text-muted-foreground text-xs">
              Add games to your library first to write about them
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => router.push("/games/search")}
          >
            Browse Games
          </Button>
        </div>
      </div>
    );
  }

  if (!selectedGameId) {
    return (
      <div className="space-y-sm">
        {defaultGame && (
          <div className="bg-accent/20 border-accent/40 px-lg py-sm flex items-center gap-2 rounded-md border text-sm">
            <div className="bg-accent/30 flex h-7 w-7 items-center justify-center rounded-md">
              <Gamepad2 className="text-accent-foreground h-4 w-4" />
            </div>
            <p className="text-accent-foreground min-w-0 flex-1 truncate">
              <span className="font-medium">Suggested: </span>
              <span className="truncate">{defaultGame.title}</span>
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => onGameSelect(defaultGame.id)}
              className="shrink-0"
            >
              Select
            </Button>
          </div>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label="Select a game"
              className="bg-card/50 hover:bg-accent/50 border-border/50 px-lg py-md gap-md h-auto w-full justify-between"
            >
              <div className="gap-md flex items-center">
                <div className="bg-muted/50 flex h-10 w-10 items-center justify-center rounded-md">
                  <Gamepad2 className="text-muted-foreground h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Select a game</p>
                  <p className="text-muted-foreground text-xs">
                    Choose from {uniqueGames.length} game
                    {uniqueGames.length !== 1 ? "s" : ""} in your library
                  </p>
                </div>
              </div>
              <ChevronsUpDown className="text-muted-foreground ml-md h-4 w-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Search games..." />
              <CommandList>
                <CommandEmpty>No games found.</CommandEmpty>
                <CommandGroup>
                  {uniqueGames.map((game) => (
                    <CommandItem
                      key={game.id}
                      value={game.title}
                      onSelect={() => {
                        onGameSelect(game.id);
                        setOpen(false);
                      }}
                      className="gap-md"
                    >
                      <div className="relative shrink-0 overflow-hidden rounded-sm shadow-sm">
                        <GameCoverImage
                          imageId={game.coverImage}
                          gameTitle={game.title}
                          size="cover_small"
                          sizes="40px"
                          className="h-12 w-9"
                          imageClassName="rounded-sm object-cover"
                        />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {game.title}
                      </span>
                      {game.id === defaultGameId && (
                        <Check className="text-primary ml-auto h-4 w-4 shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="bg-card/50 border-border/50 px-lg py-md gap-md flex items-center rounded-lg border">
      <div className="relative shrink-0 overflow-hidden rounded-md shadow-sm">
        <GameCoverImage
          imageId={selectedGame?.coverImage}
          gameTitle={selectedGame?.title ?? "Unknown Game"}
          size="cover_small"
          sizes="56px"
          className="h-16 w-12"
          imageClassName="rounded-md object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {selectedGame?.title ?? "Unknown Game"}
        </p>
        <p className="text-muted-foreground text-xs">Writing about this game</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => onGameSelect("")}
        aria-label="Change game"
        className="ml-auto shrink-0"
      >
        <X className="h-4 w-4" />
        <span className="ml-xs">Change</span>
      </Button>
    </div>
  );
}
