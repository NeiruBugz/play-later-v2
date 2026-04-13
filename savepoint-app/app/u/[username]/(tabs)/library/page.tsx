import { LibraryService } from "@/data-access-layer/services";
import type { Metadata } from "next";

import { LibraryGrid } from "@/features/profile";
import { getProfilePageData } from "@/features/profile/index.server";
import { getOptionalServerUserId } from "@/shared/lib/app/auth";

const libraryService = new LibraryService();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username}'s Library | SavePoint`,
    alternates: { canonical: `/u/${username}/library` },
  };
}

export default async function ProfileLibraryPage({
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

  const libraryResult = await libraryService.getLibraryItems({
    userId: profileResult.data.profile.id,
  });

  if (!libraryResult.success) {
    return null;
  }

  const items = libraryResult.data.items.map((item) => ({
    id: item.id,
    status: item.status,
    hasBeenPlayed: item.hasBeenPlayed,
    game: {
      title: item.game.title,
      coverImage: item.game.coverImage,
      slug: item.game.slug,
    },
  }));

  return <LibraryGrid items={items} />;
}
