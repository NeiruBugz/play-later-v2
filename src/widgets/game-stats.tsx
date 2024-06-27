import { Review } from "@prisma/client";
import { AddReviewDialog } from "@/src/features/add-review";
import igdbApi from "@/src/shared/api/igdb";

type GameStatsProps = {
  gameId: string;
  igdbId: number;
  existingReviews: Review[];
};

const calculateAverageScore = (reviews: Review[]) => {
  if (reviews.length === 0) {
    return 0;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  return parseFloat(averageRating.toFixed(2));
};

export async function GameStats({
  gameId,
  existingReviews,
  igdbId,
}: GameStatsProps) {
  const averageRating = calculateAverageScore(existingReviews);
  const aggregatedRating = await igdbApi.getGameRating(igdbId);
  console.log(aggregatedRating);
  if (averageRating === 0) {
    return (
      <div className="self-center">
        <div>No Ratings from community yet</div>
        <div>Aggregated Rating: {aggregatedRating.aggregated_rating}</div>
        <AddReviewDialog gameId={gameId} />
      </div>
    );
  }
  return (
    <div className="self-center">
      <p className="whitespace-nowrap">
        Average Rating: {averageRating} among {existingReviews.length}
      </p>
      <AddReviewDialog gameId={gameId} />
    </div>
  );
}
