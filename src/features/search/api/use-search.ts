import { SearchResponse } from "@/src/shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";

const fetchSearchResults = async (
  query: string
): Promise<{ response: SearchResponse[] }> => {
  const res = await fetch(`/api/igdb-search?q=${query}`);
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
    mutationFn: async (query: string) => {
      const response = await fetchSearchResults(query);
      return response.response;
    },
  });
}
