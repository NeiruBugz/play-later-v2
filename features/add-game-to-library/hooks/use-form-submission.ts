import { createBacklogItemWithGame } from '@/features/add-game-to-library/actions/create-game-with-backlog-item';
import type {
  FullGameInfoResponse,
  SearchResponse,
} from '@/shared/types/igdb.types';
import { toaster } from '@/shared/components/ui/toaster';
import { parse } from 'date-fns';
import { type Dispatch, useCallback } from 'react';
import { FormAction } from '@/features/add-game-to-library/types/form';
import { FormState } from '@/features/add-game-to-library/types/form';
import { formActions } from '@/features/add-game-to-library/constants/reducer';

type UseFormSubmissionProps = {
  formState: FormState;
  dispatch: Dispatch<FormAction>;
  igdbFullGameResponse?: FullGameInfoResponse;
};

export function useFormSubmission({
  formState,
  dispatch,
  igdbFullGameResponse,
}: UseFormSubmissionProps) {
  const prepareGameData = useCallback(
    (selectedGame: SearchResponse) => {
      const parsedDate = selectedGame.release_dates?.[0]?.human
        ? parse(selectedGame.release_dates[0].human, 'MMM dd, yyyy', new Date())
        : null;

      return {
        igdbId: selectedGame.id,
        name: selectedGame.name,
        coverImage: selectedGame.cover.image_id,
        description: selectedGame.summary || '',
        releaseDate: parsedDate,
        aggregatedRating: igdbFullGameResponse?.aggregated_rating || null,
        screenshots: igdbFullGameResponse?.screenshots,
        genres: igdbFullGameResponse?.genres,
      };
    },
    [igdbFullGameResponse],
  );

  const handleSuccess = useCallback(
    (gameName: string) => {
      toaster.create({
        type: 'success',
        title: `Successfully added ${gameName} to collection`,
      });

      dispatch(formActions.resetForm());
    },
    [dispatch],
  );

  const handleError = useCallback((error: unknown) => {
    console.error('Error adding game to backlog:', error);
    toaster.create({
      title: 'Failed to add a game to collection',
      type: 'error',
      description: error instanceof Error ? error.message : 'Unknown error',
    });
  }, []);

  const submitForm = useCallback(
    async (isFormValid: boolean) => {
      if (!isFormValid || !formState.selectedGame) return;

      try {
        const gameData = prepareGameData(formState.selectedGame);

        const result = await createBacklogItemWithGame({
          igdbGame: gameData,
          status: formState.statusValue[0],
          platform: formState.platformValue[0],
          acquisitionType: formState.acquisitionTypeValue[0],
        });

        if (result && typeof result === 'object' && 'error' in result) {
          throw new Error(result.error as string);
        }

        handleSuccess(formState.selectedGame.name);
      } catch (error) {
        handleError(error);
      }
    },
    [formState, prepareGameData, handleSuccess, handleError],
  );

  return { submitForm };
}
