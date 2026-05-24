import { X } from "lucide-react";

import {
  ratingStarsToStorage,
  ratingStorageToStars,
} from "@/shared/lib/rating";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { RatingInput } from "@/shared/ui/rating-input";
import { Switch } from "@/shared/ui/switch";

import type { RatingControlsProps } from "./rating-controls.type";

export function RatingControls({
  minRating,
  unratedOnly,
  onMinRatingChange,
  onClearMinRating,
  onUnratedOnlyChange,
}: RatingControlsProps) {
  return (
    <section className="space-y-sm">
      <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        Rating
      </p>
      <div className="gap-sm flex items-center">
        <Label className="text-sm font-medium">Minimum rating</Label>
        {/* `minRating` is in stars (the URL/user unit); RatingInput speaks the
            1–10 storage int internally, so convert across this boundary. */}
        <RatingInput
          value={minRating != null ? ratingStarsToStorage(minRating) : null}
          readOnly={false}
          onChange={(storage) =>
            onMinRatingChange(
              storage === null ? null : ratingStorageToStars(storage)
            )
          }
          size="sm"
          aria-label="Minimum rating filter"
        />
        {minRating !== undefined ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearMinRating}
            className="h-7"
            aria-label="Clear minimum rating"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <div className="gap-sm flex items-center">
        <Switch
          id="mobile-unrated-only"
          checked={unratedOnly === true}
          onCheckedChange={onUnratedOnlyChange}
          aria-label="Show only unrated games"
        />
        <Label htmlFor="mobile-unrated-only" className="text-sm font-medium">
          Unrated only
        </Label>
      </div>
    </section>
  );
}
