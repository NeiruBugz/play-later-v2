"use client";

import type { ImportedGame } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

import type {
  ImportedGamesResponse,
  PaginationInfo,
  UseImportedGamesOptions,
} from "../types";

type UseImportedGamesResult = {
  games: ImportedGame[];
  pagination: PaginationInfo;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

export function useImportedGames(
  options?: UseImportedGamesOptions
): UseImportedGamesResult {
  const {
    page = 1,
    limit = 25,
    enabled = true,
    search,
    playtimeStatus,
    playtimeRange,
    platform,
    lastPlayed,
    sortBy = "added_desc",
    showAlreadyImported = false,
  } = options ?? {};

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "imported-games",
      {
        page,
        limit,
        search,
        playtimeStatus,
        playtimeRange,
        platform,
        lastPlayed,
        sortBy,
        showAlreadyImported,
      },
    ],
    queryFn: async (): Promise<ImportedGamesResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.set("search", search);
      if (playtimeStatus && playtimeStatus !== "all")
        params.set("playtimeStatus", playtimeStatus);
      if (playtimeRange && playtimeRange !== "all")
        params.set("playtimeRange", playtimeRange);
      if (platform && platform !== "all") params.set("platform", platform);
      if (lastPlayed && lastPlayed !== "all")
        params.set("lastPlayed", lastPlayed);
      if (sortBy) params.set("sortBy", sortBy);
      if (showAlreadyImported)
        params.set("showAlreadyImported", showAlreadyImported.toString());

      const response = await fetch(`/api/steam/games?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch imported games");
      }

      return {
        games: result.games,
        pagination: result.pagination,
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    games: data?.games ?? [],
    pagination: data?.pagination ?? {
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 0,
    },
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
