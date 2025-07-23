import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { HTTP_RESPONSE } from "@/shared/config/http-codes";
import { type SearchResponse } from "@/shared/types";

const MIN_QUERY_LENGTH = 3;

const fetchSearchResults = async (
  query: string,
  filters?: Record<string, unknown>
): Promise<SearchResponse[]> => {
  let platforms = "";
  if (
    filters &&
    "platforms" in filters &&
    typeof filters.platforms === "string"
  ) {
    platforms = filters.platforms;
  }
  const response = await axios.get<{ response: SearchResponse[] }>(
    `/api/igdb-search?q=${query}&platforms=${platforms}`
  );

  if (response.status !== HTTP_RESPONSE.ok.code) {
    throw new Error("Network response was not ok");
  }

  return response.data.response;
};

export { fetchSearchResults };

export function useIGDBSearch(query: string | undefined) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      if (query === undefined) {
        return [];
      }
      const response = await fetchSearchResults(query);
      return response;
    },
    enabled: query !== undefined && query.length > MIN_QUERY_LENGTH,
    staleTime: 300000,
  });
}
