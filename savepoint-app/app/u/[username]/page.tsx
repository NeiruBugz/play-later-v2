import { ProfileService } from "@/data-access-layer/services";
import type { Metadata } from "next";

import { PublicProfileView } from "@/features/profile";
import { getPublicProfilePageData } from "@/features/social/use-cases/get-public-profile-page-data";
import { getOptionalServerUserId } from "@/shared/lib/app/auth";

const profileService = new ProfileService();

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
    title: `${displayName}'s Profile | SavePoint`,
    description: `View ${displayName}'s gaming profile on SavePoint.`,
    alternates: { canonical: `/u/${username}` },
    openGraph: {
      title: `${displayName}'s Profile | SavePoint`,
      description: `View ${displayName}'s gaming profile on SavePoint.`,
      type: "profile",
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const viewerUserId = await getOptionalServerUserId();

  const result = await getPublicProfilePageData({
    username,
    viewerUserId,
  });

  if (!result.success || !result.data.profile) {
    return (
      <div className="py-3xl text-center">
        <h1 className="heading-lg mb-md">Profile not found</h1>
        <p className="text-muted-foreground body-md">
          This profile doesn&apos;t exist or is set to private.
        </p>
      </div>
    );
  }

  const { profile, isOwnProfile, isAuthenticated, isFollowing } = result.data;

  return (
    <PublicProfileView
      profile={profile}
      isOwnProfile={isOwnProfile}
      isAuthenticated={isAuthenticated}
      isFollowing={isFollowing}
    />
  );
}
