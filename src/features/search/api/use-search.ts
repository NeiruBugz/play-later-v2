import { SearchResponse } from "@/src/shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";

const fetchSearchResults = async (
  query: string,
  filters?: Record<string, any>
): Promise<{ response: SearchResponse[] }> => {
  let platform = "";
  if (filters && "platform" in filters) {
    platform = filters.platform;
  }
  const res = await fetch(`/api/igdb-search?q=${query}&platform=${platform}`);
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
};

export function useIGDBSearch(query: string | undefined) {
  const { data, error, isFetching, isError, refetch, isStale } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      const response = await fetchSearchResults(query!);
      return response.response;
    },
    enabled: query !== undefined && query.length > 3,
    staleTime: 300000,
  });

  return { data, error, isFetching, isError, refetch, isStale };
}

export function useIGDBSearchMutation() {
  return useMutation({
    mutationKey: ["search", "idgb"],
    mutationFn: async ({
      query,
      filters,
    }: {
      query: string;
      filters?: Record<string, any>;
    }) => {
      const response = await fetchSearchResults(query, { platform: 6 });
      return response.response;
    },
  });
}
