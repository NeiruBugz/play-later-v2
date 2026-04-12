import type { PropsWithChildren } from "react";

import { Header, MobileNav } from "@/widgets/header";
import { CommandPaletteProvider } from "@/features/command-palette";
import { JournalFab } from "@/features/journal";
import { WhatsNewModal } from "@/features/whats-new";
import { Toaster } from "@/shared/components/ui/sonner";
import { requireServerUserId } from "@/shared/lib/app/auth";

export default async function ProtectedLayout({ children }: PropsWithChildren) {
  const userId = await requireServerUserId();
  return (
    <CommandPaletteProvider>
      <Header isAuthorised={Boolean(userId)} />
      <main
        id="main-content"
        className="px-lg pt-lg md:px-2xl md:pb-lg container mx-auto pb-36"
      >
        {children}
      </main>
      <MobileNav />
      <JournalFab />
      <Toaster />
      <WhatsNewModal />
    </CommandPaletteProvider>
  );
}
