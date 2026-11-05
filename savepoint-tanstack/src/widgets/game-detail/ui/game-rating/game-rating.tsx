import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { updateLibraryItemFn } from "@/features/manage-library-entry/api/update-library-item-fn";
import { getUserFacingErrorMessage } from "@/shared/lib/user-facing-error";
import { RatingInput } from "@/shared/ui/rating-input";
import { SectionLabel } from "@/shared/ui/section-label";

import type { GameRatingProps } from "./game-rating.type";

export function GameRating({ libraryItemId, rating }: GameRatingProps) {
  const router = useRouter();
  const [displayed, setDisplayed] = useState(rating);

  useEffect(() => {
    setDisplayed(rating);
  }, [rating]);

  const change = async (next: number | null) => {
    const previous = displayed;
    setDisplayed(next);
    try {
      await updateLibraryItemFn({
        data: { itemId: libraryItemId, rating: next },
      });
    } catch (error) {
      setDisplayed(previous);
      toast.error(getUserFacingErrorMessage(error));
      return;
    }
    await router.invalidate();
  };

  return (
    <div className="flex items-center gap-3" data-testid="game-rating">
      <SectionLabel>Rating</SectionLabel>
      <RatingInput
        value={displayed}
        readOnly={false}
        size="lg"
        onChange={(next) => void change(next)}
        aria-label={
          displayed === null ? "Rate this game" : `Rated ${displayed / 2} of 5`
        }
      />
    </div>
  );
}
