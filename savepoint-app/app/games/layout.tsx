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
import { SidebarInset, SidebarProvider } from "@/shared/components/ui/sidebar";
import { getOptionalServerUserId } from "@/shared/lib/app/auth";

import { GamesLayoutClient } from "./_components/games-layout-client";

export default async function GameDetailsLayout({
  children,
}: PropsWithChildren) {
  const userId = await getOptionalServerUserId();

  return (
    <CommandPaletteProvider>
      <GamesLayoutClient>
        <SidebarProvider>
          {userId && (
            <AppSidebar
              userSlot={
                <Suspense fallback={<SidebarUserSkeleton />}>
                  <SidebarUser userId={userId} />
                </Suspense>
              }
            />
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
