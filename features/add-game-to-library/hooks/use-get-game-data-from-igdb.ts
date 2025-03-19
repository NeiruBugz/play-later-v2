import { getIGDBGameData } from '@/shared/external-apis/igdb/igdb-actions';
import { useQuery } from '@tanstack/react-query';

type useGetGameDataFromIGDBInput = {
  gameId: number | undefined;
};

function useGetGameDataFromIGDB({ gameId }: useGetGameDataFromIGDBInput) {
  return useQuery({
    queryKey: ['igdb', 'game', 'get-by-id', gameId],
    queryFn: () => {
      if (!gameId) {
        return undefined;
      }
      return getIGDBGameData(gameId);
    },
    enabled: Boolean(gameId),
  });
}

export { useGetGameDataFromIGDB };
