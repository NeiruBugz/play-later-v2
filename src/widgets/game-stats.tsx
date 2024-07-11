import igdbApi from "@/src/shared/api/igdb";
import { Review } from "@prisma/client";
import { StarIcon } from "lucide-react";

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

  if (averageRating === 0) {
    return (
      <div className="md:self-center">
        <p className="my-2 flex items-center">
          <StarIcon className="mr-2 size-4 text-slate-500" />
          <span className="font-medium">Community Rating:&nbsp;</span>None
        </p>
        <p className="flex items-center">
          <StarIcon className="mr-2 size-4 text-slate-500" />
          <span className="font-medium">Aggregated Rating:&nbsp;</span>
          {aggregatedRating.aggregated_rating?.toFixed(1) ?? "N/A"}
        </p>
      </div>
    );
  }
  return (
    <div className="md:self-center">
      <p className="my-2 flex items-center">
        <StarIcon className="mr-2 size-4 text-slate-500" />
        <span className="font-medium">Average Rating:&nbsp;</span>
        {averageRating.toFixed(1)} among {existingReviews.length} reviews
      </p>
      <p className="flex items-center">
        <StarIcon className="mr-2 size-4 text-slate-500" />
        <span className="font-medium">Aggregated Rating:&nbsp;</span>
        {aggregatedRating.aggregated_rating?.toFixed(1) ?? "N/A"}
      </p>
    </div>
  );
}
