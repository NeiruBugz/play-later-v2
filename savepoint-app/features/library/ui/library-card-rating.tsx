"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { setLibraryRatingAction } from "@/features/manage-library-entry/server-actions";
import {
  RatingInput,
  type RatingInputSize,
} from "@/shared/components/ui/rating-input";

export interface LibraryCardRatingProps {
  libraryItemId: number;
  initialRating: number | null;
  size?: RatingInputSize;
}

export function LibraryCardRating({
  libraryItemId,
  initialRating,
  size = "sm",
}: LibraryCardRatingProps) {
  const [optimisticRating, setOptimisticRating] = useOptimistic<
    number | null,
    number | null
  >(initialRating, (_prev, next) => next);
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const handleChange = (next: number | null) => {
    const previous = optimisticRating;
    startTransition(async () => {
      setOptimisticRating(next);
      try {
        const result = await setLibraryRatingAction({
          libraryItemId,
          rating: next,
        });
        if (!result.success) {
          setOptimisticRating(previous);
          toast.error("Failed to update rating", {
            description: result.error,
          });
        } else {
          await queryClient.invalidateQueries({ queryKey: ["library"] });
        }
      } catch (error) {
        setOptimisticRating(previous);
        toast.error("Failed to update rating", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      }
    });
  };

  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if ("preventDefault" in e) {
      e.preventDefault();
    }
  };

  return (
    <span
      data-library-interactive
      data-testid="library-card-rating-interactive"
      onClick={stop}
      onMouseDown={stop}
      onKeyDown={stop}
    >
      <RatingInput
        value={optimisticRating}
        size={size}
        readOnly={false}
        onChange={handleChange}
      />
    </span>
  );
}
