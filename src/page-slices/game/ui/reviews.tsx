import { getReviews } from "@/src/entities/review";
import { Review } from "@/src/entities/review/ui/review";
import { AddReviewDialog } from "@/src/features/add-review";

export async function Reviews({
  gameId,
  gameTitle,
}: {
  gameId: string;
  gameTitle: string;
}) {
  const reviewList = await getReviews(gameId);

  if (!reviewList) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No reviews yet. Be the first to write a review!
      </div>
    );
  }

  return (
    <div className="border-b py-4">
      <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
        Reviews
      </h3>
      <div className="flex flex-col items-start gap-4 md:flex-row">
        <div className="mt-2 min-w-full md:min-w-[270px]">
          <AddReviewDialog gameId={gameId} gameTitle={gameTitle} />
        </div>
        <ul className="flex max-h-[300px] flex-wrap justify-evenly gap-4 overflow-auto md:max-h-[600px]">
          {reviewList.length ? (
            reviewList.map((review) => {
              return <Review review={review} key={review.id} />;
            })
          ) : (
            <div className="py-1 text-center text-muted-foreground">
              No reviews yet. Be the first to write a review!
            </div>
          )}
        </ul>
      </div>
    </div>
  );
}
