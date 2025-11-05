import { useInfiniteQuery } from "@tanstack/react-query";

import type { GameSearchResponse } from "../types";

const PAGE_SIZE = 10;

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
    enabled: query.length >= 3,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.games?.length === PAGE_SIZE
        ? allPages.length * PAGE_SIZE
        : undefined;
    },
    initialPageParam: 0,
  });
};
