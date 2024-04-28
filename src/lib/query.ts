import type { SearchResponse } from "@/src/lib/types/igdb";

import { useMutation } from "@tanstack/react-query";

export function useSearch() {
  return useMutation({
    mutationFn: async (searchTerm: string) => {
      const request = await fetch(`api/search?q=${searchTerm}`);
      const { response } = await request.json();
      return response as SearchResponse[];
    },
  });
}
