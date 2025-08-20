import { Star } from "lucide-react";

import { getAggregatedReviewRatings } from "../../server-actions/get-aggregated-review-ratings";

export async function AverageRatingCard() {
  const averageRatingResult = await getAggregatedReviewRatings();
  const { data: averageRatingData } = averageRatingResult;

  const averageRating = averageRatingData?._avg.rating ?? 0;
  const avgRating = averageRating ? Math.round(averageRating * 10) / 10 : 0;

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">
          Avg. Rating
        </div>
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold">{avgRating}/10</div>
          <div className="text-primary">
            <Star className="size-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
