import { searchGamesAction } from '@/shared/external-apis/igdb/igdb-actions';

import { useQuery } from '@tanstack/react-query';

type useGetSuggestionsInput = {
  searchQuery: string;
  isEnabled: boolean;
};

function useGetSuggestions({ searchQuery, isEnabled }: useGetSuggestionsInput) {
  return useQuery({
    queryKey: ['search', 'games', searchQuery],
    queryFn: () => searchGamesAction(searchQuery),
    enabled: isEnabled,
  });
}

export { useGetSuggestions };
