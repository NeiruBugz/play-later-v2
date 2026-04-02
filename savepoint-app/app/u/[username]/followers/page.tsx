import { ProfileService, SocialService } from "@/data-access-layer/services";
import type { Metadata } from "next";

import { FollowersList } from "@/features/social";

const profileService = new ProfileService();
const socialService = new SocialService();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const result = await profileService.getPublicProfile(username);

  if (!result.success || !result.data.profile) {
    return { title: "Profile Not Found | SavePoint" };
  }

  const displayName = result.data.profile.name ?? result.data.profile.username;

  return {
    title: `${displayName}'s Followers | SavePoint`,
    description: `See who follows ${displayName} on SavePoint.`,
    alternates: { canonical: `/u/${username}/followers` },
  };
}

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profileResult = await profileService.getPublicProfile(username);

  if (!profileResult.success || !profileResult.data.profile) {
    return (
      <div className="py-3xl text-center">
        <h1 className="heading-lg mb-md">Profile not found</h1>
        <p className="text-muted-foreground body-md">
          This profile doesn&apos;t exist or is set to private.
        </p>
      </div>
    );
  }

  const { profile } = profileResult.data;
  const followersResult = await socialService.getFollowers(profile.id);

  if (!followersResult.success) {
    return (
      <div className="py-3xl text-center">
        <h1 className="heading-lg mb-md">Something went wrong</h1>
        <p className="text-muted-foreground body-md">
          Could not load followers. Please try again later.
        </p>
      </div>
    );
  }

  const displayName = profile.name ?? profile.username;

  return (
    <div className="space-y-lg">
      <h1 className="heading-lg tracking-tight">{displayName}&apos;s Followers</h1>
      <FollowersList
        users={followersResult.data.followers}
        total={followersResult.data.total}
      />
    </div>
  );
}
