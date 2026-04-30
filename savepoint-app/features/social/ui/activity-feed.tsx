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

  let initialData: Awaited<ReturnType<typeof service.getFeedForUser>>;
  try {
    initialData = await service.getFeedForUser(userId);
  } catch {
    initialData = { items: [], nextCursor: null };
  }

  const hasItems = initialData.items.length > 0;

  if (!hasItems) {
    let popularItems: typeof initialData.items = [];
    try {
      const popularResult = await service.getPopularFeed(userId);
      popularItems = popularResult.items;
    } catch {
      popularItems = [];
    }

    return (
      <Card variant="flat" className="flex flex-1 flex-col">
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
    <Card variant="flat" className="flex flex-1 flex-col">
      <CardHeader spacing="comfortable">
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader>

      <CardContent spacing="comfortable">
        <ActivityFeedClient initialData={initialData} />
      </CardContent>
    </Card>
  );
}
