import { formatDistanceToNow } from "date-fns";
import { Activity, CheckCircle2, Star } from "lucide-react";

import { Body, Caption, Heading } from "@/shared/components/typography";

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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="size-5" />
        <Heading level={3} size="lg">
          Recent Activity
        </Heading>
      </div>
      <div className="space-y-3">
        {!hasActivity ? (
          <Body size="sm" variant="muted">
            No recent activity.
          </Body>
        ) : (
          <>
            {recentlyCompleted.data?.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <Body
                    size="sm"
                    className="truncate font-medium leading-tight"
                  >
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
            {recentReviews.data?.slice(0, 2).map((review) => (
              <div key={review.id} className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                  <Star className="size-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <Body
                    size="sm"
                    className="truncate font-medium leading-tight"
                  >
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
      </div>
    </div>
  );
}
