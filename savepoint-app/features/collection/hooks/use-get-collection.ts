import type { CollectionResult } from "@/data-access-layer/services/collection/types";
import { useQuery } from "@tanstack/react-query";

import { queryConfig } from "@/shared/config/query-config";
import type { FilterParams } from "@/shared/types/collection";

type ErrorResponse = {
  error: string;
};

type CollectionResponse = CollectionResult;

const calculateRetryDelay = (attemptIndex: number): number => {
  const exponentialDelay = queryConfig.RETRY_BASE_DELAY_MS * 2 ** attemptIndex;
  return Math.min(exponentialDelay, queryConfig.RETRY_MAX_DELAY_MS);
};

const queryFn = async (
  params?: Omit<FilterParams, "page"> & { page?: number }
): Promise<CollectionResponse> => {
  const searchParams = new URLSearchParams();

  if (params?.platform) searchParams.set("platform", params.platform);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", params.page.toString());

  const response = await fetch(`/api/collection?${searchParams.toString()}`);
  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(errorData.error || "Failed to get collection");
  }
  return await response.json();
};

export function useGetCollection(
  params?: Omit<FilterParams, "page"> & { page?: number }
) {
  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ["collection", params],
    queryFn: () => queryFn(params),
    retry: queryConfig.MAX_RETRIES,
    retryDelay: calculateRetryDelay,
    staleTime: queryConfig.STALE_TIME_MS,
  });

  return {
    data: {
      collection: data?.collection || [],
      count: data?.count || 0,
    },
    isLoading,
    error,
    isFetching,
    refetch,
  };
}
