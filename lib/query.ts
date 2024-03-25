import { useMutation } from "@tanstack/react-query";

import type { SearchResponse } from "@/types/igdb";

export function useSearch() {
  return useMutation({
    mutationFn: async (searchTerm: string) => {
      const request = await fetch(`api/search?q=${searchTerm}`);
      const { response } = await request.json();
      return response as SearchResponse[];
    },
  });
}
