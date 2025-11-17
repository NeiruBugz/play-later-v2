import { useInfiniteQuery } from "@tanstack/react-query";
import {
  GAME_SEARCH_GC_TIME_MS,
  GAME_SEARCH_STALE_TIME_MS,
  MIN_SEARCH_QUERY_LENGTH,
} from "@/shared/constants";
import { GAME_SEARCH_PAGE_SIZE } from "../constants";
import type { GameSearchResponse } from "../types";
export const useGameSearch = (query: string) => {
  return useInfiniteQuery({
    queryKey: ["game-search", query],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(
        `/api/games/search?q=${encodeURIComponent(query)}&offset=${pageParam}`
      );
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Try again later.");
      }
      if (!response.ok) {
        throw new Error(
          "Game search is temporarily unavailable. Please try again later."
        );
      }
      return response.json() as Promise<GameSearchResponse>;
    },
    enabled: query.length >= MIN_SEARCH_QUERY_LENGTH,
    staleTime: GAME_SEARCH_STALE_TIME_MS,
    gcTime: GAME_SEARCH_GC_TIME_MS,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.games?.length === GAME_SEARCH_PAGE_SIZE
        ? allPages.length * GAME_SEARCH_PAGE_SIZE
        : undefined;
    },
    initialPageParam: 0,
  });
};
