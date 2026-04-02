import { ActivityFeedService } from "@/data-access-layer/services";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { ActivityFeedClient } from "./activity-feed-client";
import { ActivityFeedEmpty } from "./activity-feed-empty";

export async function ActivityFeed({ userId }: { userId: string }) {
  const service = new ActivityFeedService();
  const result = await service.getFeedForUser(userId);

  const initialData = result.success
    ? result.data
    : { items: [], nextCursor: null };

  const hasItems = initialData.items.length > 0;

  if (!hasItems) {
    const popularResult = await service.getPopularFeed(userId);
    const popularItems = popularResult.success ? popularResult.data.items : [];

    return (
      <Card variant="flat">
        <CardHeader spacing="comfortable">
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>

        <CardContent spacing="comfortable">
          <ActivityFeedEmpty items={popularItems} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="flat">
      <CardHeader spacing="comfortable">
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader>

      <CardContent spacing="comfortable">
        <ActivityFeedClient initialData={initialData} />
      </CardContent>
    </Card>
  );
}
