import { Suspense, type PropsWithChildren } from "react";

import { MobileNav } from "@/widgets/mobile-nav";
import { MobileTopbar } from "@/widgets/mobile-topbar";
import { AppSidebar } from "@/widgets/sidebar";
import {
  SidebarUser,
  SidebarUserSkeleton,
} from "@/widgets/sidebar/ui/sidebar-user";
import { CommandPaletteProvider } from "@/features/command-palette";
import { JournalFab } from "@/features/journal";
import { WhatsNewModal } from "@/features/whats-new";
import { SidebarInset, SidebarProvider } from "@/shared/components/ui/sidebar";
import { Toaster } from "@/shared/components/ui/sonner";
import { requireServerUserId } from "@/shared/lib/app/auth";

import { ProtectedLayoutClient } from "./_components/protected-layout-client";

export default async function ProtectedLayout({ children }: PropsWithChildren) {
  const userId = await requireServerUserId();

  return (
    <CommandPaletteProvider>
      <ProtectedLayoutClient>
        <SidebarProvider>
          <AppSidebar
            userSlot={
              <Suspense fallback={<SidebarUserSkeleton />}>
                <SidebarUser userId={userId} />
              </Suspense>
            }
          />

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
