import { ProfileService, SocialService } from "@/data-access-layer/services";
import type { Metadata } from "next";

import { FollowingList } from "@/features/social";

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
    title: `${displayName}'s Following | SavePoint`,
    description: `See who ${displayName} follows on SavePoint.`,
    alternates: { canonical: `/u/${username}/following` },
  };
}

export default async function FollowingPage({
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
  const followingResult = await socialService.getFollowing(profile.id);

  if (!followingResult.success) {
    return (
      <div className="py-3xl text-center">
        <h1 className="heading-lg mb-md">Something went wrong</h1>
        <p className="text-muted-foreground body-md">
          Could not load following. Please try again later.
        </p>
      </div>
    );
  }

  const displayName = profile.name ?? profile.username;

  return (
    <div className="space-y-lg">
      <h1 className="heading-lg tracking-tight">{displayName}&apos;s Following</h1>
      <FollowingList
        users={followingResult.data.following}
        total={followingResult.data.total}
      />
    </div>
  );
}
