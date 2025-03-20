import {
  type Dispatch,
  type RefObject,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { formActions } from '../../../app/(app)/collection/add/_components/form-reducer';
import { SearchResponse } from '@/shared/types/igdb.types';
import { useGetSuggestions } from './use-get-suggestions';
import { FormAction } from '@/features/add-game-to-library/types/form';

type UseSearchStateProps = {
  dispatch: Dispatch<FormAction>;
  isGameSelected: RefObject<boolean>;
};

export function useSearchState({
  dispatch,
  isGameSelected,
}: UseSearchStateProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounceValue(searchQuery, 300);

  useEffect(() => {
    if (debouncedQuery.length === 0) {
      isGameSelected.current = false;
      dispatch(formActions.setSelectedGame(null));
    }
  }, [debouncedQuery, dispatch, isGameSelected]);

  const { data: suggestions, isLoading: isFetchingSuggestions } =
    useGetSuggestions({
      searchQuery: debouncedQuery,
      isEnabled: debouncedQuery.length >= 3 && !isGameSelected.current,
    });

  const handleSelectGame = useCallback(
    (game: SearchResponse | null) => {
      dispatch(formActions.setSelectedGame(game));
    },
    [dispatch],
  );

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    suggestions,
    isFetchingSuggestions,
    handleSelectGame,
  };
}
