"use client";

import { Storefront } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/shared/components/button";
import { Card, CardContent, CardHeader } from "@/shared/components/card";
import { Skeleton } from "@/shared/components/skeleton";
import { Heading } from "@/shared/components/typography";

import { getImportedGames } from "../server-actions/get-imported-games";
import { ImportedGameCard } from "./imported-game-card";
import {
  ImportedGamesFilters,
  type ImportedGamesFilters as FiltersType,
} from "./imported-games-filters";

interface ImportedGame {
  id: string;
  name: string;
  storefront: Storefront;
  storefrontGameId: string | null;
  playtime: number | null;
  img_icon_url: string | null;
  img_logo_url: string | null;
}

interface ImportedGamesProps {
  initialGames: ImportedGame[];
  initialTotalGames: number;
  initialPage?: number;
  limit?: number;
}

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

function ImportedGamesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Card key={i} className="h-full overflow-hidden">
          <div className="aspect-[16/9]">
            <Skeleton className="h-full w-full" />
          </div>
          <CardHeader className="p-3 pb-2">
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ImportedGames({
  initialGames,
  initialTotalGames,
  initialPage = 1,
  limit = 20,
}: ImportedGamesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FiltersType>({
    search: searchParams.get("search") || "",
    storefront: (searchParams.get("storefront") as Storefront) || "ALL",
    sortBy: (searchParams.get("sortBy") as FiltersType["sortBy"]) || "name",
    sortOrder:
      (searchParams.get("sortOrder") as FiltersType["sortOrder"]) || "asc",
  });

  const [games, setGames] = useState(initialGames);
  const [totalGames, setTotalGames] = useState(initialTotalGames);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isPending, startTransition] = useTransition();

  const debouncedSearch = useDebounce(filters.search, 300);

  const lastSearchRef = useRef(filters.search);

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
    async (page: number = 1, filtersToUse: FiltersType) => {
      startTransition(async () => {
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
            // Update the last search ref when we successfully load
            lastSearchRef.current = filtersToUse.search;
          }
        } catch (error) {
          console.error("Failed to load imported games:", error);
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

  useEffect(() => {
    if (debouncedSearch !== lastSearchRef.current) {
      const filtersWithDebouncedSearch = {
        ...filters,
        search: debouncedSearch,
      };
      loadGames(1, filtersWithDebouncedSearch);
    }
  }, [debouncedSearch, filters, loadGames]);

  const loadPage = async (page: number) => {
    const currentFilters = { ...filters, search: debouncedSearch };
    updateURL(currentFilters, page);
    loadGames(page, currentFilters);
  };

  const totalPages = Math.ceil(totalGames / limit);

  if (games.length === 0 && !isPending) {
    const hasActiveFilters = filters.search || filters.storefront !== "ALL";

    return (
      <div className="space-y-6">
        <div>
          <Heading level={1} className="mb-1">
            Imported Games
          </Heading>
          <p className="text-muted-foreground">
            Manage your imported game library
          </p>
        </div>

        <ImportedGamesFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalGames={initialTotalGames}
          filteredGames={0}
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
      {/* Header */}
      <div>
        <Heading level={1} className="mb-1">
          Imported Games
        </Heading>
        <p className="text-muted-foreground">
          Manage your imported game library
        </p>
      </div>

      {/* Filters */}
      <ImportedGamesFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalGames={initialTotalGames}
        filteredGames={totalGames}
      />

      {/* Games Grid */}
      {isPending ? (
        <ImportedGamesSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {games.map((game) => (
            <ImportedGameCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {/* Pagination */}
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
