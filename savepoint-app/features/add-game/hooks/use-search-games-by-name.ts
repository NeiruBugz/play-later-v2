import type { GameSearchResult } from "@/data-access-layer/services/igdb/types";
import { useQuery } from "@tanstack/react-query";

import { queryConfig } from "@/shared/config/query-config";

type SearchApiResponse = {
  games: GameSearchResult["games"];
};

type ErrorResponse = {
  error: string;
};

const QUERY_CONFIG = {
  MIN_QUERY_LENGTH: 3,
  ...queryConfig,
} as const;

const calculateRetryDelay = (attemptIndex: number): number => {
  const exponentialDelay = QUERY_CONFIG.RETRY_BASE_DELAY_MS * 2 ** attemptIndex;
  return Math.min(exponentialDelay, QUERY_CONFIG.RETRY_MAX_DELAY_MS);
};

const queryFn = async (query: string): Promise<SearchApiResponse> => {
  const searchParams = new URLSearchParams({ query });
  const response = await fetch(`/api/search?${searchParams.toString()}`);

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(errorData.error || "Failed to search games");
  }

  return response.json();
};

export function useSearchGamesByName(query: string) {
  const trimmedQuery = query.trim();

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["search", trimmedQuery],
    queryFn: () => queryFn(trimmedQuery),
    enabled: trimmedQuery.length >= QUERY_CONFIG.MIN_QUERY_LENGTH,
    staleTime: QUERY_CONFIG.STALE_TIME_MS,
    retry: QUERY_CONFIG.MAX_RETRIES,
    retryDelay: calculateRetryDelay,
  });

  return {
    games: data?.games ?? [],
    isLoading,
    isFetching,
    error: error as Error | null,
    isError: !!error,
  };
}
