import { notFound } from "next/navigation";
import type { PropsWithChildren } from "react";

import { Header, MobileNav } from "@/widgets/header";
import { CommandPaletteProvider } from "@/features/command-palette";
import { ProfileHeader, ProfilePrivateMessage } from "@/features/profile";
import { getProfilePageData } from "@/features/profile/index.server";
import { getOptionalServerUserId } from "@/shared/lib/app/auth";

type LayoutProps = PropsWithChildren<{
  params: Promise<{ username: string }>;
}>;

export default async function PublicProfileLayout({
  children,
  params,
}: LayoutProps) {
  const { username } = await params;
  const viewerUserId = await getOptionalServerUserId();

  const result = await getProfilePageData(username, viewerUserId ?? undefined);

  if (!result.success || !result.data.profile) {
    notFound();
  }

  const { profile, socialCounts, viewer, isPrivate } = result.data;
  const isOwner = viewer.isOwner;
  const showPrivateMessage = isPrivate && !isOwner;

  return (
    <CommandPaletteProvider>
      <Header isAuthorised={viewerUserId !== null} />
      <main
        id="main-content"
        className="px-lg pt-lg md:px-2xl md:pb-lg container mx-auto pb-36"
      >
        <div className="space-y-2xl">
          <ProfileHeader
            profile={{
              id: profile.id,
              username: profile.username,
              name: profile.name,
              image: profile.image,
              isPublicProfile: profile.isPublicProfile,
            }}
            socialCounts={socialCounts}
            viewer={viewer}
          />
          {showPrivateMessage ? <ProfilePrivateMessage /> : children}
        </div>
      </main>
      {viewerUserId && <MobileNav />}
    </CommandPaletteProvider>
  );
}
