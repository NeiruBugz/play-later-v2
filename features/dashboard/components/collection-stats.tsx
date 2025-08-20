import { BacklogItemStatus } from "@prisma/client";
import { Library, Star, Trophy } from "lucide-react";

import { getBacklogItemsCount } from "@/features/dashboard/server-actions/get-backlog-items-count";
import { Body } from "@/shared/components/typography";
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Library />
          Collection Stats
        </CardTitle>
        <CardDescription>Your gaming journey at a glance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Body size="sm" variant="muted">
            Total Games
          </Body>
          <Body size="sm" className="font-semibold">
            {totalGames}
          </Body>
        </div>
        <div className="flex items-center justify-between">
          <Body size="sm" variant="muted" className="flex items-center gap-2">
            <Trophy className="text-muted-foreground" />
            Completion Rate
          </Body>
          <Body size="sm" className="font-semibold">
            {completionRate}%
          </Body>
        </div>
        {avgRating > 0 && (
          <div className="flex items-center justify-between">
            <Body size="sm" variant="muted" className="flex items-center gap-2">
              <Star className="text-muted-foreground" />
              Avg. Rating
            </Body>
            <Body size="sm" className="font-semibold">
              {avgRating}/10
            </Body>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
