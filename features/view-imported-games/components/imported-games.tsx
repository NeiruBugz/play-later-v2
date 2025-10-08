"use client";

import { type Storefront } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  GridSkeleton,
  ListSearchInput,
  Pagination,
  Toolbar,
} from "@/shared/components";
import { Heading } from "@/shared/components/typography";

import {
  useImportedGames,
  type ImportedGame,
} from "../hooks/use-imported-games";
import { ImportedGameCard } from "./imported-game-card";
import {
  ImportedGamesFilterPanel,
  type ImportedGamesFilters as FiltersType,
} from "./imported-games-filter-panel";

type ImportedGamesProps = {
  limit?: number;
};

type OptimisticAction =
  | { type: "REMOVE_GAME"; gameId: string }
  | { type: "RESET" };

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

export function ImportedGames({ limit = 24 }: ImportedGamesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FiltersType>({
    search: searchParams.get("search") ?? "",
    storefront: (searchParams.get("storefront") as Storefront) || "ALL",
    sortBy: (searchParams.get("sortBy") as FiltersType["sortBy"]) || "name",
    sortOrder:
      (searchParams.get("sortOrder") as FiltersType["sortOrder"]) || "asc",
  });

  const currentPage = Number(searchParams.get("page")) || 1;

  const { data, isLoading, isFetching, error } = useImportedGames({
    page: currentPage,
    limit,
    search: filters.search || undefined,
    storefront: filters.storefront,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  console.log({ filters });

  const [isPending, startTransition] = useTransition();
  const [optimisticGames, addOptimisticUpdate] = useOptimistic(
    data?.games ?? [],
    optimisticReducer
  );

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

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    updateURL(newFilters, 1);
  };

  const handleImportSuccess = (importedGameId: string) => {
    startTransition(() => {
      addOptimisticUpdate({ type: "REMOVE_GAME", gameId: importedGameId });
    });
  };

  const handleSearchApply = () => {
    const search = searchParams.get("search");
    if (!search) return;
    updateURL({ ...filters, search }, 1);
  };

  if (error) {
    toast.error("Failed to load imported games", {
      description: error.message,
    });
  }

  if (isLoading) {
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
          resultsText="Loading..."
        />
        <GridSkeleton count={limit} />
      </div>
    );
  }

  const totalGames = data?.totalGames ?? 0;
  const displayGames = optimisticGames;

  // Empty state
  if (displayGames.length === 0 && !isFetching) {
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
          resultsText={`${totalGames} games`}
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
        resultsText={`${totalGames} games`}
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
        {isFetching && !isPending && (
          <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm">
            <GridSkeleton count={10} />
          </div>
        )}

        <div
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${
            isFetching ? "opacity-70 transition-opacity duration-200" : ""
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
