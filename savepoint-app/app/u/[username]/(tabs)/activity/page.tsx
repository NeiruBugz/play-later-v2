import { ActivityFeedService } from "@/data-access-layer/services/activity-feed/activity-feed-service";
import type { Metadata } from "next";

import { ActivityLog } from "@/features/profile";
import { getProfilePageData } from "@/features/profile/index.server";
import type { ActivityLogPage } from "@/features/profile/lib/activity-log-types";
import { getOptionalServerUserId } from "@/shared/lib/app/auth";

const activityFeedService = new ActivityFeedService();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username}'s Activity | SavePoint`,
    alternates: { canonical: `/u/${username}/activity` },
  };
}

export default async function ProfileActivityPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const viewerUserId = await getOptionalServerUserId();

  const profileResult = await getProfilePageData(
    username,
    viewerUserId ?? undefined
  );

  if (!profileResult.success || !profileResult.data.profile) {
    return null;
  }

  if (profileResult.data.isPrivate) {
    return null;
  }

  const activityResult = await activityFeedService.getUserActivity(
    profileResult.data.profile.id
  );

  if (!activityResult.success) {
    return null;
  }

  const initialData: ActivityLogPage = {
    items: activityResult.data.items.map((item) => ({
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
    nextCursor: activityResult.data.nextCursor
      ? {
          timestamp: new Date(activityResult.data.nextCursor.timestamp),
          id: Number(activityResult.data.nextCursor.id),
        }
      : null,
  };

  return (
    <ActivityLog
      userId={profileResult.data.profile.id}
      initialData={initialData}
    />
  );
}
