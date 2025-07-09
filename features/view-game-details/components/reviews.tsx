import { ReviewForm } from "@/features/add-review/components";

import { getReviews } from "../server-actions/get-reviews";
import { Review } from "./review";

export async function Reviews({ gameId }: { gameId: string }) {
  const reviewsResult = await getReviews({ gameId });

  // Handle possible failure
  if (reviewsResult.serverError || !reviewsResult.data) {
    console.error("Failed to fetch reviews:");
    return (
      <div className="py-12 text-center text-muted-foreground">
        Failed to load reviews. Please try again later.
      </div>
    );
  }

  const reviewList = reviewsResult.data;

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
