import { correctGameMatch } from '@/app/(app)/collection/[gameId]/_actions/correct-game-match';
import { toaster } from '@/shared/components/ui/toaster';
import { useMutation } from '@tanstack/react-query';

function useCorrectMismatch({
  onSuccessCallback,
}: {
  onSuccessCallback: () => void;
}) {
  return useMutation({
    mutationFn: correctGameMatch,
    onSuccess: () => {
      toaster.create({
        title: 'Match corrected',
        description: 'The game match has been successfully corrected.',
        type: 'success',
      });
      onSuccessCallback();

      // Invalidate relevant queries
    },
    onError: (error) => {
      console.error('Failed to correct game match:', error);
      toaster.create({
        title: 'Correction failed',
        description: 'Failed to correct the game match. Please try again.',
        type: 'error',
      });
    },
  });
}

export { useCorrectMismatch };
