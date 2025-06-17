import type { SearchResponse } from "@/shared/types";
import axios from "axios";

const fetchSearchResults = async (
  query: string,
  filters?: Record<string, any>
): Promise<SearchResponse[]> => {
  let platforms = "";
  if (filters && "platforms" in filters) {
    platforms = filters.platforms;
  }
  const res = await axios.get<{ response: SearchResponse[] }>(
    `/api/igdb-search?q=${query}&platforms=${platforms}`
  );

  if (res.status !== 200) {
    throw new Error("Network response was not ok");
  }

  return res.data.response;
};

export { fetchSearchResults };
