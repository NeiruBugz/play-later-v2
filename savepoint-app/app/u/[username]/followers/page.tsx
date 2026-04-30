import {
  ProfileService,
  SocialService,
  type PaginatedFollowersResult,
} from "@/data-access-layer/services";
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

  let profile: Awaited<ReturnType<ProfileService["getPublicProfile"]>>;
  try {
    profile = await profileService.getPublicProfile(username);
  } catch {
    return { title: "Profile Not Found | SavePoint" };
  }

  if (!profile) {
    return { title: "Profile Not Found | SavePoint" };
  }

  const displayName = profile.name ?? profile.username;

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

  let profile: Awaited<ReturnType<ProfileService["getPublicProfile"]>>;
  try {
    profile = await profileService.getPublicProfile(username);
  } catch {
    return (
      <div className="py-3xl text-center">
        <h1 className="heading-lg mb-md">Profile not found</h1>
        <p className="text-muted-foreground body-md">
          This profile doesn&apos;t exist or is set to private.
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-3xl text-center">
        <h1 className="heading-lg mb-md">Profile not found</h1>
        <p className="text-muted-foreground body-md">
          This profile doesn&apos;t exist or is set to private.
        </p>
      </div>
    );
  }

  const displayName = profile.name ?? profile.username;

  let followers: PaginatedFollowersResult | null = null;
  try {
    followers = await socialService.getFollowers(profile.id);
  } catch {
    return (
      <div className="py-3xl text-center">
        <h1 className="heading-lg mb-md">Something went wrong</h1>
        <p className="text-muted-foreground body-md">
          Could not load followers. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <h1 className="heading-lg tracking-tight">
        {displayName}&apos;s Followers
      </h1>
      <FollowersList users={followers.followers} total={followers.total} />
    </div>
  );
}
