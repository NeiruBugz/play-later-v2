"use client";

import type { GetLibraryItemsResult } from "@/data-access-layer/services";
import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Gamepad2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { GameCoverImage } from "@/shared/components/game-cover-image";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/ui/utils";

interface GameSelectorProps {
  onGameSelect: (
    gameId: string,
    gameTitle: string,
    coverImage: string | null
  ) => void;
  onCancel?: () => void;
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

function GameItemSkeleton() {
  return (
    <div className="gap-lg px-md py-sm flex items-center rounded-lg border border-transparent">
      <Skeleton className="h-16 w-12 shrink-0 rounded-md" />
      <div className="space-y-sm min-w-0 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-lg">
      <div className="space-y-md">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <div className="space-y-sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <GameItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function GameSelector({
  onGameSelect,
  onCancel,
  defaultGameId,
}: GameSelectorProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

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

  const filteredGames = uniqueGames.filter((game) =>
    game.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const virtualizer = useVirtualizer({
    count: filteredGames.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  useEffect(() => {
    if (defaultGameId && uniqueGames.length > 0 && !hasAutoSelected) {
      const defaultGame = uniqueGames.find((game) => game.id === defaultGameId);
      if (defaultGame) {
        setHasAutoSelected(true);
      }
    }
  }, [defaultGameId, uniqueGames, hasAutoSelected]);

  const defaultGame = defaultGameId
    ? uniqueGames.find((game) => game.id === defaultGameId)
    : null;

  if (isLoading) {
    return (
      <div className="space-y-xl">
        <div className="space-y-sm">
          <h2 className="text-lg font-medium font-semibold">Select a Game</h2>
          <p className="text-muted-foreground text-sm">
            Choose from your library
          </p>
        </div>
        <LoadingState />
        {onCancel && (
          <div className="flex items-center justify-end">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-xl">
        <div className="space-y-sm">
          <h2 className="text-lg font-medium font-semibold">Select a Game</h2>
          <p className="text-destructive text-sm">
            Failed to load your library
            {error instanceof Error ? `: ${error.message}` : ""}
          </p>
        </div>
        <div className="gap-md flex items-center justify-end">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="button" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!uniqueGames || uniqueGames.length === 0) {
    return (
      <div className="space-y-xl">
        <div className="space-y-sm">
          <h2 className="text-lg font-medium font-semibold">Select a Game</h2>
        </div>
        <div className="gap-lg bg-muted/20 px-xl py-3xl flex flex-col items-center rounded-lg border border-dashed text-center">
          <div className="bg-muted/50 flex h-16 w-16 items-center justify-center rounded-full">
            <Gamepad2 className="text-muted-foreground/60 h-8 w-8" />
          </div>
          <div className="space-y-xs">
            <p className="font-medium">No games in your library</p>
            <p className="text-muted-foreground text-sm">
              Add games to your library first to write about them
            </p>
          </div>
          <Button type="button" onClick={() => router.push("/games/search")}>
            Browse Games
          </Button>
        </div>
        {onCancel && (
          <div className="flex items-center justify-end">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <div className="space-y-sm">
        <h2 className="text-lg font-medium font-semibold">Select a Game</h2>
        <p className="text-muted-foreground text-sm">
          {uniqueGames.length} game{uniqueGames.length !== 1 ? "s" : ""} in your
          library
        </p>
      </div>

      {defaultGame && hasAutoSelected && (
        <div className="bg-accent/50 border-accent px-lg py-md flex items-center gap-3 rounded-lg border">
          <div className="relative shrink-0 overflow-hidden rounded-md shadow-sm">
            <GameCoverImage
              imageId={defaultGame.coverImage}
              gameTitle={defaultGame.title}
              size="cover_small"
              sizes="48px"
              className="h-14 w-10"
              imageClassName="rounded-md object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-accent-foreground text-sm font-medium">
              Auto-selected your current game
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {defaultGame.title}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              onGameSelect(
                defaultGame.id,
                defaultGame.title,
                defaultGame.coverImage
              )
            }
          >
            Continue
          </Button>
        </div>
      )}

      <div className="relative">
        <Search className="left-md text-muted-foreground pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          type="search"
          placeholder="Search your games..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-xl pr-xl"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="right-md p-xs text-muted-foreground hover:text-foreground absolute top-1/2 -translate-y-1/2 rounded-sm transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {searchQuery && (
        <p className="text-muted-foreground text-xs">
          {filteredGames.length} result{filteredGames.length !== 1 ? "s" : ""}{" "}
          for "{searchQuery}"
        </p>
      )}

      {filteredGames.length === 0 ? (
        <div className="gap-md bg-muted/20 px-xl py-2xl flex flex-col items-center rounded-lg border border-dashed text-center">
          <Search className="text-muted-foreground/40 h-8 w-8" />
          <div className="space-y-xs">
            <p className="text-muted-foreground text-sm">
              No games found matching "{searchQuery}"
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-primary text-sm underline-offset-2 hover:underline"
            >
              Clear search
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="bg-card/50 relative max-h-[360px] overflow-y-auto rounded-lg border"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const game = filteredGames[virtualItem.index];
              if (!game) return null;

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() =>
                    onGameSelect(game.id, game.title, game.coverImage)
                  }
                  className={cn(
                    "gap-lg px-md py-sm absolute top-0 left-0 flex w-full items-center",
                    "border-border/30 border-b last:border-b-0",
                    "transition-colors duration-150",
                    "hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none"
                  )}
                  style={{
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="relative shrink-0 overflow-hidden rounded-md shadow-sm">
                    <GameCoverImage
                      imageId={game.coverImage}
                      gameTitle={game.title}
                      size="cover_small"
                      sizes="48px"
                      className="h-14 w-10"
                      imageClassName="rounded-md object-cover"
                    />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
                    {game.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {onCancel && (
        <div className="border-border/50 pt-lg flex items-center justify-end border-t">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
