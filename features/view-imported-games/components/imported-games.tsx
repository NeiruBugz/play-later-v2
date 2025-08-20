"use client";

import { type Storefront } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import { Body, Heading } from "@/shared/components/typography";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";

import { getImportedGames } from "../server-actions/get-imported-games";
import { ImportedGameCard } from "./imported-game-card";
import {
  ImportedGamesFilters,
  type ImportedGamesFilters as FiltersType,
} from "./imported-games-filters";

type ImportedGame = {
  id: string;
  name: string;
  storefront: Storefront;
  storefrontGameId: string | null;
  playtime: number | null;
  img_icon_url: string | null;
  img_logo_url: string | null;
};

type ImportedGamesProps = {
  initialGames: ImportedGame[];
  initialTotalGames: number;
  initialPage?: number;
  limit?: number;
};

type OptimisticAction =
  | { type: "REMOVE_GAME"; gameId: string }
  | { type: "RESET" };

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function optimisticReducer(
  state: ImportedGame[],
  action: OptimisticAction
): ImportedGame[] {
  switch (action.type) {
    case "REMOVE_GAME":
      return state.filter((game) => game.id !== action.gameId);
    case "RESET":
      return state;
    default:
      return state;
  }
}

function ImportedGamesSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-md border bg-card">
          <div className="aspect-[2/3]">
            <Skeleton className="size-full" />
          </div>
          <div className="flex flex-col p-2">
            <div className="mb-2 h-8">
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-7 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ImportedGames({
  initialGames,
  initialTotalGames,
  initialPage = 1,
  limit = 18,
}: ImportedGamesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FiltersType>({
    search: searchParams.get("search") ?? "",
    storefront: (searchParams.get("storefront") as Storefront) || "ALL",
    sortBy: (searchParams.get("sortBy") as FiltersType["sortBy"]) || "name",
    sortOrder:
      (searchParams.get("sortOrder") as FiltersType["sortOrder"]) || "asc",
  });

  const [games, setGames] = useState(initialGames);
  const [totalGames, setTotalGames] = useState(initialTotalGames);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isPending, startTransition] = useTransition();
  const [isSearchPending, startSearchTransition] = useTransition();

  const [optimisticGames, addOptimisticUpdate] = useOptimistic(
    games,
    optimisticReducer
  );

  const debouncedSearch = useDebounce(filters.search, 300);
  const lastSearchRef = useRef(filters.search);
  const lastServerSearchRef = useRef("");

  const updateURL = useCallback(
    (newFilters: FiltersType, page: number = 1) => {
      const params = new URLSearchParams();

      if (newFilters.search) params.set("search", newFilters.search);
      if (newFilters.storefront !== "ALL")
        params.set("storefront", newFilters.storefront);
      if (newFilters.sortBy !== "name") params.set("sortBy", newFilters.sortBy);
      if (newFilters.sortOrder !== "asc")
        params.set("sortOrder", newFilters.sortOrder);
      if (page > 1) params.set("page", page.toString());

      const url = params.toString() ? `?${params.toString()}` : "";
      router.replace(url, { scroll: false });
    },
    [router]
  );

  const loadGames = useCallback(
    async (
      page: number = 1,
      filtersToUse: FiltersType,
      isSearchOnly = false
    ) => {
      const transition = isSearchOnly ? startSearchTransition : startTransition;

      transition(async () => {
        try {
          const result = await getImportedGames({
            page,
            limit,
            search: filtersToUse.search || undefined,
            storefront:
              filtersToUse.storefront !== "ALL"
                ? filtersToUse.storefront
                : undefined,
            sortBy: filtersToUse.sortBy,
            sortOrder: filtersToUse.sortOrder,
          });

          if (result?.data) {
            setGames(result.data.games);
            setTotalGames(result.data.totalGames);
            setCurrentPage(page);
            lastSearchRef.current = filtersToUse.search;
            lastServerSearchRef.current = filtersToUse.search;
          }
        } catch (error) {
          toast.error("Failed to load imported games", {
            description:
              error instanceof Error ? error.message : "Server error",
          });
        }
      });
    },
    [limit]
  );

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);

    const searchChanged = newFilters.search !== filters.search;
    const otherFiltersChanged =
      newFilters.storefront !== filters.storefront ||
      newFilters.sortBy !== filters.sortBy ||
      newFilters.sortOrder !== filters.sortOrder;

    if (otherFiltersChanged) {
      updateURL(newFilters, 1);
      loadGames(1, newFilters);
    } else if (searchChanged) {
      updateURL(newFilters, 1);
    }
  };

  const handleImportSuccess = useCallback(
    (importedGameId: string) => {
      startTransition(() => {
        addOptimisticUpdate({ type: "REMOVE_GAME", gameId: importedGameId });
      });

      setTimeout(() => {
        const currentFilters = { ...filters, search: debouncedSearch };
        loadGames(currentPage, currentFilters);
      }, 500);
    },
    [addOptimisticUpdate, filters, debouncedSearch, loadGames, currentPage]
  );

  useEffect(() => {
    if (debouncedSearch !== lastSearchRef.current) {
      const filtersWithDebouncedSearch = {
        ...filters,
        search: debouncedSearch,
      };

      if (debouncedSearch !== lastServerSearchRef.current) {
        loadGames(1, filtersWithDebouncedSearch, true);
      }
    }
  }, [debouncedSearch, filters, loadGames]);

  const loadPage = async (page: number) => {
    const currentFilters = { ...filters, search: debouncedSearch };
    updateURL(currentFilters, page);
    loadGames(page, currentFilters);
  };

  const totalPages = Math.ceil(totalGames / limit);

  // Use optimistic games for removal, but regular games for search to avoid conflicts
  const displayGames = optimisticGames;

  if (displayGames.length === 0 && !isPending && !isSearchPending) {
    const hasActiveFilters = filters.search || filters.storefront !== "ALL";

    return (
      <div className="space-y-6">
        <ImportedGamesFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalGames={initialTotalGames}
          filteredGames={0}
        />

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-6 text-5xl">{hasActiveFilters ? "🔍" : "📦"}</div>
          <Heading level={2} size="xl" className="mb-3">
            {hasActiveFilters
              ? "No games match your filters"
              : "No imported games found"}
          </Heading>
          <Body variant="muted" className="max-w-md">
            {hasActiveFilters
              ? "Try adjusting your search or filters to find games"
              : "Connect your gaming accounts to import your library"}
          </Body>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ImportedGamesFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalGames={initialTotalGames}
        filteredGames={totalGames}
      />

      <div className="relative">
        {isPending && !isSearchPending && (
          <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm">
            <ImportedGamesSkeleton />
          </div>
        )}

        <div
          className={`grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 ${
            isSearchPending ? "opacity-70 transition-opacity duration-200" : ""
          }`}
        >
          {displayGames.map((game) => (
            <ImportedGameCard
              key={game.id}
              game={game}
              onImportSuccess={handleImportSuccess}
            />
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPage(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
          >
            Previous
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => loadPage(pageNum)}
                  disabled={isPending}
                  className="w-8"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isPending}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
