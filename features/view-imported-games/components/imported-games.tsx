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

// no-op
import {
  GridSkeleton,
  ListSearchInput,
  Pagination,
  Toolbar,
} from "@/shared/components";
import { Heading } from "@/shared/components/typography";

import { getImportedGames } from "../server-actions/get-imported-games";
import { ImportedGameCard } from "./imported-game-card";
import {
  ImportedGamesFilterPanel,
  type ImportedGamesFilters as FiltersType,
} from "./imported-games-filter-panel";

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

// Use shared grid skeleton for consistency

export function ImportedGames({
  initialGames,
  initialTotalGames,
  initialPage = 1,
  limit = 24,
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

  // Removed unused loadPage and totalPages - pagination is handled by PaginationControls component

  // Use optimistic games for removal, but regular games for search to avoid conflicts
  const displayGames = optimisticGames;

  if (displayGames.length === 0 && !isPending && !isSearchPending) {
    const hasActiveFilters = filters.search || filters.storefront !== "ALL";

    return (
      <div className="space-y-6">
        <Toolbar
          searchSlot={
            <ListSearchInput placeholder="Search imported games..." />
          }
          filtersPanel={
            <ImportedGamesFilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          }
          resultsText={`${initialTotalGames} games`}
        />

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 text-6xl">{hasActiveFilters ? "🔍" : "📦"}</div>
          <Heading level={2} className="mb-2">
            {hasActiveFilters
              ? "No games match your filters"
              : "No imported games found"}
          </Heading>
          <p className="text-muted-foreground">
            {hasActiveFilters
              ? "Try adjusting your search or filters to find games"
              : "Connect your gaming accounts to import your library"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toolbar
        searchSlot={<ListSearchInput placeholder="Search imported games..." />}
        filtersPanel={
          <ImportedGamesFilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        }
        resultsText={
          totalGames === initialTotalGames
            ? `${totalGames} games`
            : `${totalGames} of ${initialTotalGames} games`
        }
        hasActiveFilters={
          !!filters.search ||
          filters.storefront !== "ALL" ||
          filters.sortBy !== "name" ||
          filters.sortOrder !== "asc"
        }
        activeFiltersCount={
          [filters.search && "s", filters.storefront !== "ALL" && "p"].filter(
            Boolean
          ).length
        }
      />

      <div className="relative">
        {isPending && !isSearchPending && (
          <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm">
            <GridSkeleton count={10} />
          </div>
        )}

        <div
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${
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

      <Pagination total={totalGames} pageSize={limit} />
    </div>
  );
}
