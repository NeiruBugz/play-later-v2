"use server";

import { ActivityFeedService } from "@/data-access-layer/services/activity-feed/activity-feed-service";
import { ProfileService } from "@/data-access-layer/services/profile/profile-service";

import { getOptionalServerUserId } from "@/shared/lib/app/auth";

import type {
  ActivityLogCursor,
  ActivityLogPage,
} from "../lib/activity-log-types";

export type FetchUserActivityInput = {
  userId: string;
  cursor?: ActivityLogCursor;
  limit?: number;
};

function toIsoString(timestamp: Date | string): string {
  return typeof timestamp === "string" ? timestamp : timestamp.toISOString();
}

export async function fetchUserActivityAction(
  input: FetchUserActivityInput
): Promise<ActivityLogPage> {
  const viewerUserId = await getOptionalServerUserId();
  const profileService = new ProfileService();

  const profileResult = await profileService.getProfile({
    userId: input.userId,
  });
  if (!profileResult.success) {
    throw new Error(profileResult.error);
  }
  const isOwner = viewerUserId === input.userId;
  if (!profileResult.data.profile.isPublicProfile && !isOwner) {
    throw new Error("Profile is private");
  }

  const service = new ActivityFeedService();
  const serviceCursor = input.cursor
    ? {
        timestamp: toIsoString(input.cursor.timestamp),
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
