import { ProfileService } from "@/data-access-layer/services";
import type { Metadata } from "next";

import { OverviewTab } from "@/features/profile";
import { getProfilePageData } from "@/features/profile/index.server";
import { getOptionalServerUserId } from "@/shared/lib/app/auth";

const profileService = new ProfileService();

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

export default async function ProfileOverviewPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const viewerUserId = await getOptionalServerUserId();

  const result = await getProfilePageData(username, viewerUserId ?? undefined);

  if (!result.success || !result.data.profile) {
    return null;
  }

  const { stats, libraryPreview, gameCount, isPrivate } = result.data;

  if (isPrivate) {
    return null;
  }

  return (
    <OverviewTab
      stats={stats!}
      libraryPreview={libraryPreview ?? []}
      gameCount={gameCount}
    />
  );
}
