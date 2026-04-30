import { ProfileService } from "@/data-access-layer/services";
import { notFound } from "next/navigation";
import type { PropsWithChildren } from "react";

import { Header } from "@/widgets/header";
import { MobileNav } from "@/widgets/mobile-nav";
import { MobileTopbar } from "@/widgets/mobile-topbar";
import { AppSidebar } from "@/widgets/sidebar";
import { CommandPaletteProvider } from "@/features/command-palette";
import { ProfileHeader, ProfilePrivateMessage } from "@/features/profile";
import { getProfilePageData } from "@/features/profile/index.server";
import { SidebarInset, SidebarProvider } from "@/shared/components/ui/sidebar";
import { getOptionalServerUserId } from "@/shared/lib/app/auth";

import { PublicProfileLayoutClient } from "./_components/public-profile-layout-client";

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

  let displayName = "User";
  let avatarUrl: string | null = null;
  if (viewerUserId) {
    const profileService = new ProfileService();
    try {
      const viewerProfile = await profileService.getProfile({
        userId: viewerUserId,
      });
      displayName = viewerProfile.username ?? "User";
      avatarUrl = viewerProfile.image ?? null;
    } catch {
      // non-critical — sidebar still renders with defaults
    }
  }

  return (
    <CommandPaletteProvider>
      <PublicProfileLayoutClient>
        <SidebarProvider>
          {viewerUserId && (
            <AppSidebar displayName={displayName} avatarUrl={avatarUrl} />
          )}

          <SidebarInset id="main-content">
            {viewerUserId ? (
              <MobileTopbar />
            ) : (
              <div className="md:hidden">
                <Header isAuthorised={false} />
              </div>
            )}

            <main className="px-lg pt-lg md:px-2xl md:pb-lg container mx-auto pb-36">
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
          </SidebarInset>
        </SidebarProvider>

        {viewerUserId && <MobileNav />}
      </PublicProfileLayoutClient>
    </CommandPaletteProvider>
  );
}
