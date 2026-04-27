import { isSuccessResult, ProfileService } from "@/data-access-layer/services";
import type { PropsWithChildren } from "react";

import { Header } from "@/widgets/header";
import { MobileNav } from "@/widgets/mobile-nav";
import { MobileTopbar } from "@/widgets/mobile-topbar";
import { AppSidebar } from "@/widgets/sidebar";
import { CommandPaletteProvider } from "@/features/command-palette";
import { SidebarInset, SidebarProvider } from "@/shared/components/ui/sidebar";
import { getOptionalServerUserId } from "@/shared/lib/app/auth";

import { GamesLayoutClient } from "./_components/games-layout-client";

export default async function GameDetailsLayout({
  children,
}: PropsWithChildren) {
  const userId = await getOptionalServerUserId();

  let displayName = "User";
  let avatarUrl: string | null = null;

  if (userId) {
    const profileService = new ProfileService();
    const profileResult = await profileService.getProfile({ userId });

    if (isSuccessResult(profileResult)) {
      displayName = profileResult.data.profile.username ?? "User";
      avatarUrl = profileResult.data.profile.image ?? null;
    }
  }

  return (
    <CommandPaletteProvider>
      <GamesLayoutClient>
        <SidebarProvider>
          {userId && (
            <AppSidebar displayName={displayName} avatarUrl={avatarUrl} />
          )}

          <SidebarInset>
            {userId ? (
              <MobileTopbar />
            ) : (
              <div className="md:hidden">
                <Header isAuthorised={false} />
              </div>
            )}

            <div className="md:pb-3xl pb-24">{children}</div>
          </SidebarInset>
        </SidebarProvider>

        {userId && <MobileNav />}
      </GamesLayoutClient>
    </CommandPaletteProvider>
  );
}
