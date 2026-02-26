import type { PropsWithChildren } from "react";

import { JournalFab } from "@/features/journal/ui/journal-fab";
import { WhatsNewModal } from "@/features/whats-new";
import { CommandPaletteProvider } from "@/shared/components/command-palette";
import { Header } from "@/shared/components/header";
import { MobileNav } from "@/shared/components/mobile-nav";
import { Toaster } from "@/shared/components/ui/sonner";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const dynamic = "force-dynamic";
export default async function ProtectedLayout({ children }: PropsWithChildren) {
  const userId = await requireServerUserId();
  return (
    <CommandPaletteProvider>
      <Header isAuthorised={Boolean(userId)} />
      <main id="main-content" className="py-lg md:pb-lg container mx-auto pb-24">{children}</main>
      <MobileNav />
      <JournalFab />
      <Toaster />
      <WhatsNewModal />
    </CommandPaletteProvider>
  );
}
