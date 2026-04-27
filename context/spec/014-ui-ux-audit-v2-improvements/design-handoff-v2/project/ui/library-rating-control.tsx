"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setLibraryRatingAction } from "@/features/manage-library-entry/server-actions";
import {
  RatingInput,
  type RatingInputSize,
} from "@/shared/components/ui/rating-input";

export interface LibraryRatingControlProps {
  libraryItemId: number;
  initialRating: number | null;
  size?: RatingInputSize;
}

export function LibraryRatingControl({
  libraryItemId,
  initialRating,
  size = "md",
}: LibraryRatingControlProps) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [, startTransition] = useTransition();

  const handleChange = (next: number | null) => {
    const previous = rating;
    setRating(next);

    startTransition(async () => {
      try {
        const result = await setLibraryRatingAction({
          libraryItemId,
          rating: next,
        });

        if (!result.success) {
          setRating(previous);
          toast.error("Failed to update rating", {
            description: result.error,
          });
        }
      } catch (error) {
        setRating(previous);
        toast.error("Failed to update rating", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      }
    });
  };

  return (
    <RatingInput
      value={rating}
      size={size}
      readOnly={false}
      onChange={handleChange}
    />
  );
}
