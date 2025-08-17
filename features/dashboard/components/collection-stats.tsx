import { BacklogItemStatus } from "@prisma/client";
import { Library, Star, Trophy } from "lucide-react";

import { getBacklogItemsCount } from "@/features/dashboard/server-actions/get-backlog-items-count";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { getAggregatedReviewRatings } from "../server-actions/get-aggregated-review-ratings";

export async function CollectionStats() {
  const [totalGamesResult, completedGamesResult, averageRatingResult] =
    await Promise.all([
      getBacklogItemsCount({}),
      getBacklogItemsCount({
        status: BacklogItemStatus.COMPLETED,
      }),
      getAggregatedReviewRatings(),
    ]);

  const { data: averageRatingData } = averageRatingResult;

  const totalGames = totalGamesResult.data ?? 0;
  const completedGames = completedGamesResult.data ?? 0;
  const averageRating = averageRatingData?._avg.rating ?? 0;

  const completionRate =
    totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0;
  const avgRating = averageRating ? Math.round(averageRating * 10) / 10 : 0;

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Library className="size-5" />
          Collection Stats
        </CardTitle>
        <CardDescription>Your gaming journey at a glance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Games</span>
          <span className="font-semibold">{totalGames}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">
              Completion Rate
            </span>
          </div>
          <span className="font-semibold">{completionRate}%</span>
        </div>
        {avgRating > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Avg Rating</span>
            </div>
            <span className="font-semibold">{avgRating}/10</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
