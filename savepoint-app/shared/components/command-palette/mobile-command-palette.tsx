"use client";

import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Drawer } from "vaul";

import { useGameSearch } from "@/features/game-search/hooks/use-game-search";
import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/shared/components/ui/command";
import { MIN_SEARCH_QUERY_LENGTH } from "@/shared/constants";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

import { getRecentGamesAction } from "./actions/get-recent-games";
import type {
  CommandPaletteProps,
  GameSearchItem,
  RecentGameItem,
} from "./command-palette.types";
import { GameResultItem } from "./game-result-item";

export function MobileCommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recentGames, setRecentGames] = useState<RecentGameItem[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 300);
  const shouldSearch = debouncedQuery.length >= MIN_SEARCH_QUERY_LENGTH;

  const { data, isLoading, error } = useGameSearch(debouncedQuery);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingRecent(true);
      getRecentGamesAction()
        .then((result) => {
          if (result.success && result.data) {
            setRecentGames(result.data);
          }
        })
        .finally(() => {
          setIsLoadingRecent(false);
        });
    }
  }, [isOpen]);

  const handleGameSelect = (slug: string) => {
    router.push(`/games/${slug}`);
    onClose();
    setQuery("");
  };

  const handleAddToLibrary = (game: GameSearchItem) => {
    router.push(`/games/${game.slug}`);
    onClose();
    setQuery("");
  };

  const searchResults =
    data?.pages.flatMap((page) =>
      page.games.map((game) => ({
        id: game.id,
        name: game.name,
        slug: game.slug,
        coverImageId: game.cover?.image_id ?? null,
        releaseYear: game.first_release_date
          ? new Date(game.first_release_date * 1000).getFullYear()
          : null,
        platforms: game.platforms?.map((p) => p.name) ?? [],
      }))
    ) ?? [];

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setQuery("");
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="bg-background fixed inset-x-0 bottom-0 z-50 mt-24 flex h-[96%] flex-col rounded-t-xl">
          <div className="mt-lg bg-muted mx-auto h-1.5 w-12 shrink-0 rounded-full" />

          <div className="border-border px-lg pb-md pt-sm flex items-center justify-between border-b">
            <Drawer.Title className="text-base font-semibold">
              Search Games
            </Drawer.Title>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            <Command shouldFilter={false} className="h-full">
              <div className="px-lg pt-md">
                <CommandInput
                  placeholder="Search for games..."
                  value={query}
                  onValueChange={setQuery}
                />
              </div>
              <CommandList className="px-lg pb-lg max-h-full">
                {isLoading && shouldSearch && (
                  <div className="py-2xl flex items-center justify-center">
                    <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                  </div>
                )}

                {error && shouldSearch && (
                  <CommandEmpty>
                    Failed to search games. Please try again.
                  </CommandEmpty>
                )}

                {!shouldSearch &&
                  !isLoadingRecent &&
                  recentGames.length > 0 && (
                    <CommandGroup heading="Recent Games">
                      {recentGames.map((game) => (
                        <GameResultItem
                          key={game.id}
                          game={{
                            id: game.id,
                            name: game.name,
                            slug: game.slug,
                            coverImageId: game.coverImageId,
                            releaseYear: null,
                            platforms: [],
                          }}
                          onSelect={() => handleGameSelect(game.slug)}
                        />
                      ))}
                    </CommandGroup>
                  )}

                {!shouldSearch &&
                  !isLoadingRecent &&
                  recentGames.length === 0 && (
                    <CommandEmpty>
                      Start typing to search for games...
                    </CommandEmpty>
                  )}

                {shouldSearch && !isLoading && searchResults.length > 0 && (
                  <CommandGroup heading="Search Results">
                    {searchResults.map((game) => (
                      <GameResultItem
                        key={game.id}
                        game={game}
                        onSelect={() => handleGameSelect(game.slug)}
                        onAddToLibrary={handleAddToLibrary}
                      />
                    ))}
                  </CommandGroup>
                )}

                {shouldSearch &&
                  !isLoading &&
                  searchResults.length === 0 &&
                  !error && (
                    <CommandEmpty>No games found for "{query}"</CommandEmpty>
                  )}
              </CommandList>
            </Command>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
