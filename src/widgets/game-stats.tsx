import { AddReviewDialog } from "@/src/features/add-review/ui/add-review-dialog";
import { Review } from "@prisma/client";

type GameStatsProps = {
  gameId: string;
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

export function GameStats({ gameId, existingReviews }: GameStatsProps) {
  const averageRating = calculateAverageScore(existingReviews);
  return (
    <div>
      <p className="whitespace-nowrap">
        Average Rating: {averageRating} among {existingReviews.length}
      </p>
      <AddReviewDialog />
    </div>
  );
}
