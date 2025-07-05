import { useMutation, useQuery } from "@tanstack/react-query";

import { fetchSearchResults } from "../lib/fetch-search-results";

export function useIGDBSearch(query: string | undefined) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      const response = await fetchSearchResults(query!);
      return response;
    },
    enabled: query !== undefined && query.length > 3,
    staleTime: 300000,
  });
}
