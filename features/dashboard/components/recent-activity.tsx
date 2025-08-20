import { formatDistanceToNow } from "date-fns";
import { Activity, CheckCircle2, Star } from "lucide-react";

import { Body, Caption } from "@/shared/components/typography";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { getRecentCompletedBacklogItems } from "../server-actions/get-recent-completed-backlog-items";
import { getRecentReviews } from "../server-actions/get-recent-reviews";

export async function RecentActivity() {
  const [recentlyCompleted, recentReviews] = await Promise.all([
    getRecentCompletedBacklogItems(),
    getRecentReviews(),
  ]);

  const hasActivity =
    (recentlyCompleted?.data?.length && recentlyCompleted?.data?.length > 0) ||
    (recentReviews?.data?.length && recentReviews?.data?.length > 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity />
          Recent Activity
        </CardTitle>
        <CardDescription>Your latest gaming milestones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasActivity ? (
          <Body size="sm" variant="muted">
            No recent activity.
          </Body>
        ) : (
          <>
            {recentlyCompleted.data?.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 size-4 text-muted-foreground" />
                <div className="flex-1">
                  <Body size="sm" className="font-medium leading-tight">
                    Completed {item.game.title}
                  </Body>
                  <Caption>
                    {item.completedAt &&
                      formatDistanceToNow(item.completedAt, {
                        addSuffix: true,
                      })}
                  </Caption>
                </div>
              </div>
            ))}
            {recentReviews.data?.map((review) => (
              <div key={review.id} className="flex items-start gap-3">
                <Star className="mt-1 size-4 text-muted-foreground" />
                <div className="flex-1">
                  <Body size="sm" className="font-medium leading-tight">
                    Reviewed {review.Game.title} ({review.rating}/10)
                  </Body>
                  <Caption>
                    {formatDistanceToNow(review.createdAt, { addSuffix: true })}
                  </Caption>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
