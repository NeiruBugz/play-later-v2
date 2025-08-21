import { ReviewForm } from "@/features/add-review/components";
import { Body, Heading } from "@/shared/components/typography";

import { getReviews } from "../server-actions/get-reviews";
import { Review } from "./review";

export async function Reviews({ gameId }: { gameId: string }) {
  const reviewsResult = await getReviews({ gameId });

  if (reviewsResult.serverError !== undefined || !reviewsResult.data) {
    return (
      <Body variant="muted" className="py-12 text-center">
        Failed to load reviews. Please try again later.
      </Body>
    );
  }

  const reviewList = reviewsResult.data;

  return (
    <div className="space-y-6">
      <ReviewForm gameId={gameId} />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Heading level={3} size="md">
            User Reviews
          </Heading>
        </div>
        <div className="space-y-6">
          {reviewList.length ? (
            reviewList.map((review) => {
              return <Review review={review} key={review.id} />;
            })
          ) : (
            <Body variant="muted" className="py-1 text-center">
              No reviews yet. Be the first to write a review!
            </Body>
          )}
        </div>
      </div>
    </div>
  );
}
