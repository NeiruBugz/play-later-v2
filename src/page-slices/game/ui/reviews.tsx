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

  return (
    <div className="border-b py-4">
      <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
        Reviews
      </h3>
      <div className="flex flex-col items-start gap-4 md:flex-row">
        <div className="min-w-full md:min-w-[270px]">
          <AddReviewDialog gameId={gameId} gameTitle={gameTitle} />
        </div>
        <ul className="flex flex-wrap justify-evenly gap-4 max-h-[300px] md:max-h-[600px] overflow-auto">
          {reviewList.length ? (
            reviewList.map((review) => {
              return <Review review={review} key={review.id} />;
            })
          ) : (
            <p>No reviews yet</p>
          )}
        </ul>
      </div>
    </div>
  );
}
