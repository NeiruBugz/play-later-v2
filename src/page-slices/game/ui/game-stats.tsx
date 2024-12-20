import igdbApi from "@/src/shared/api/igdb";
import { Card, CardContent } from "@/src/shared/ui/card";
import { Review } from "@prisma/client";
import { Star } from "lucide-react";

type GameStatsProps = {
  gameId: string;
  igdbId: number;
};

const calculateAverageScore = (reviews: Review[]) => {
  if (reviews.length === 0) {
    return 0;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  return parseFloat(averageRating.toFixed(2));
};

export async function GameStats({ igdbId }: GameStatsProps) {
  const aggregatedRating = await igdbApi.getGameRating(igdbId);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
          </div>
          <div className="text-2xl font-medium">
            {aggregatedRating?.aggregated_rating?.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">Aggregated Rating</div>
        </div>
      </CardContent>
    </Card>
  );
}