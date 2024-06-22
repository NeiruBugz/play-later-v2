import { useQuery } from "@tanstack/react-query";

export function useHowLongToBeatSearch(searchQuery?: string) {
  return useQuery({
    queryKey: ['how-long-to-beat-search', searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/hltb-data?q=${searchQuery}`);
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
    enabled: searchQuery !== undefined,
    staleTime: 300000,
  })
}