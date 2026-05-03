import { notFound } from "next/navigation";
import { Suspense, type PropsWithChildren } from "react";

import { Header } from "@/widgets/header";
import { MobileNav } from "@/widgets/mobile-nav";
import { MobileTopbar } from "@/widgets/mobile-topbar";
import { AppSidebar } from "@/widgets/sidebar";
import {
  SidebarUser,
  SidebarUserSkeleton,
} from "@/widgets/sidebar/ui/sidebar-user";
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

  return (
    <CommandPaletteProvider>
      <PublicProfileLayoutClient>
        <SidebarProvider>
          {viewerUserId && (
            <AppSidebar
              userSlot={
                <Suspense fallback={<SidebarUserSkeleton />}>
                  <SidebarUser userId={viewerUserId} />
                </Suspense>
              }
            />
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
