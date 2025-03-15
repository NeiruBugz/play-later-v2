import { fetchSteamGames } from '../actions/import-steam-games';
import { useQuery } from '@tanstack/react-query';
import { SortField, SortDirection } from '../types';

export function useGetSteamGames({
  steamId,
  page,
  pageSize,
  showGameList,
  sortField,
  sortDirection,
  fetchAllPages = false,
}: {
  steamId: string;
  page: number;
  pageSize: number;
  showGameList: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  fetchAllPages?: boolean;
}) {
  return useQuery({
    queryKey: [
      'steamGames',
      steamId,
      fetchAllPages ? 'all' : page,
      pageSize,
      sortField,
      sortDirection,
    ],
    queryFn: async () => {
      if (!steamId.trim()) return null;

      const result = await fetchSteamGames({
        steamId,
        page: fetchAllPages ? 0 : page,
        pageSize: fetchAllPages ? 9999 : pageSize,
        sortField,
        sortDirection,
      });

      if (result?.validationErrors) {
        throw new Error(Object.values(result.validationErrors).join(', '));
      }

      return result?.data;
    },
    enabled: showGameList && !!steamId.trim(),
  });
}
