"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useGameSearch } from "@/features/game-search/hooks/use-game-search";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/shared/components/ui/command";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { MIN_SEARCH_QUERY_LENGTH } from "@/shared/constants";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

import { useQuickAddFromPalette } from "../hooks/use-quick-add-from-palette";
import { getRecentGamesAction } from "../server-actions/get-recent-games";
import type {
  CommandPaletteProps,
  RecentGameItem,
} from "./command-palette.types";
import { GameResultItem } from "./game-result-item";

export function DesktopCommandPalette({
  isOpen,
  onClose,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recentGames, setRecentGames] = useState<RecentGameItem[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 300);
  const shouldSearch = debouncedQuery.length >= MIN_SEARCH_QUERY_LENGTH;

  const { data, isLoading, error } = useGameSearch(debouncedQuery);

  const closeAndReset = () => {
    onClose();
    setQuery("");
  };

  const { quickAdd } = useQuickAddFromPalette({ onSuccess: closeAndReset });

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        setIsLoadingRecent(true);
        return getRecentGamesAction();
      })
      .then((result) => {
        if (cancelled || !result) return;
        if (result.success && result.data) {
          setRecentGames(result.data);
        }
      })
      .catch((error) => {
        if (!cancelled) console.error("Failed to fetch recent games:", error);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRecent(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleNavigateToDetail = (slug: string) => {
    router.push(`/games/${slug}`);
    closeAndReset();
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
    if (!open) closeAndReset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search all games to add..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[400px]">
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

            {!shouldSearch && !isLoadingRecent && recentGames.length > 0 && (
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
                    onSelect={() => handleNavigateToDetail(game.slug)}
                  />
                ))}
              </CommandGroup>
            )}

            {!shouldSearch && !isLoadingRecent && recentGames.length === 0 && (
              <CommandEmpty>Start typing to search for games...</CommandEmpty>
            )}

            {shouldSearch && !isLoading && searchResults.length > 0 && (
              <CommandGroup heading="Search Results">
                {searchResults.map((game) => (
                  <GameResultItem
                    key={game.id}
                    game={game}
                    showAddHint
                    onSelect={() =>
                      quickAdd({
                        igdbId: Number(game.id),
                        gameName: game.name,
                      })
                    }
                  />
                ))}
              </CommandGroup>
            )}

            {shouldSearch &&
              !isLoading &&
              searchResults.length === 0 &&
              !error && (
                <CommandEmpty>
                  No games found for &ldquo;{query}&rdquo;
                </CommandEmpty>
              )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
