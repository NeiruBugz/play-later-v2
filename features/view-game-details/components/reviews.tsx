import { ReviewService } from "@/domain/review/service";

import { ReviewForm } from "@/features/add-review/components";

import { Review } from "./review";

export async function Reviews({ gameId }: { gameId: string }) {
  const reviewsResult = await ReviewService.getAll(gameId);

  // Handle possible failure
  if (reviewsResult.isFailure) {
    console.error("Failed to fetch reviews:", reviewsResult.error);
    return (
      <div className="py-12 text-center text-muted-foreground">
        Failed to load reviews. Please try again later.
      </div>
    );
  }

  const reviewList = reviewsResult.value;

  return (
    <div className="space-y-6">
      <ReviewForm gameId={gameId} />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">User Reviews</h3>
        </div>
        <div className="space-y-6">
          {reviewList.length ? (
            reviewList.map((review) => {
              return <Review review={review} key={review.id} />;
            })
          ) : (
            <div className="py-1 text-center text-muted-foreground">
              No reviews yet. Be the first to write a review!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
