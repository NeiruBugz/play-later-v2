"use server";

import { ActivityFeedService } from "@/data-access-layer/services/activity-feed/activity-feed-service";

import type {
  ActivityLogCursor,
  ActivityLogPage,
} from "../lib/activity-log-types";

export type FetchUserActivityInput = {
  userId: string;
  cursor?: ActivityLogCursor;
  limit?: number;
};

export async function fetchUserActivityAction(
  input: FetchUserActivityInput
): Promise<ActivityLogPage> {
  const service = new ActivityFeedService();
  const serviceCursor = input.cursor
    ? {
        timestamp: input.cursor.timestamp.toISOString(),
        id: String(input.cursor.id),
      }
    : undefined;

  const result = await service.getUserActivity(
    input.userId,
    serviceCursor,
    input.limit
  );

  if (!result.success) {
    throw new Error(result.error);
  }

  const mapped = result.data;

  return {
    items: mapped.items.map((item) => ({
      id: Number(item.id),
      status: item.status,
      createdAt: new Date(item.timestamp),
      statusChangedAt:
        item.eventType === "STATUS_CHANGE" ? new Date(item.timestamp) : null,
      activityTimestamp: new Date(item.timestamp),
      userId: item.user.id,
      gameId: item.game.id,
      userName: item.user.name,
      userUsername: item.user.username,
      userImage: item.user.image,
      gameTitle: item.game.title,
      gameCoverImage: item.game.coverImage,
      gameSlug: item.game.slug,
    })),
    nextCursor: mapped.nextCursor
      ? {
          timestamp: new Date(mapped.nextCursor.timestamp),
          id: Number(mapped.nextCursor.id),
        }
      : null,
  };
}
