import { isSuccessResult, ProfileService } from "@/data-access-layer/services";
import type { PropsWithChildren } from "react";

import { MobileNav } from "@/widgets/mobile-nav";
import { MobileTopbar } from "@/widgets/mobile-topbar";
import { AppSidebar } from "@/widgets/sidebar";
import { CommandPaletteProvider } from "@/features/command-palette";
import { JournalFab } from "@/features/journal";
import { WhatsNewModal } from "@/features/whats-new";
import { SidebarInset, SidebarProvider } from "@/shared/components/ui/sidebar";
import { Toaster } from "@/shared/components/ui/sonner";
import { requireServerUserId } from "@/shared/lib/app/auth";

import { ProtectedLayoutClient } from "./_components/protected-layout-client";

export default async function ProtectedLayout({ children }: PropsWithChildren) {
  const userId = await requireServerUserId();

  const profileService = new ProfileService();
  const profileResult = await profileService.getProfile({ userId });

  const displayName =
    isSuccessResult(profileResult) && profileResult.data.profile.username
      ? profileResult.data.profile.username
      : "User";
  const avatarUrl = isSuccessResult(profileResult)
    ? (profileResult.data.profile.image ?? null)
    : null;

  return (
    <CommandPaletteProvider>
      <ProtectedLayoutClient>
        <SidebarProvider>
          <AppSidebar displayName={displayName} avatarUrl={avatarUrl} />

          <SidebarInset id="main-content">
            <MobileTopbar />

            <div className="px-lg pt-lg md:px-2xl md:pb-lg container mx-auto pb-36">
              {children}
            </div>

            <JournalFab />
          </SidebarInset>
        </SidebarProvider>

        <MobileNav />

        <Toaster />
        <WhatsNewModal />
      </ProtectedLayoutClient>
    </CommandPaletteProvider>
  );
}
