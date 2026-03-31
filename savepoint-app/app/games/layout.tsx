import type { PropsWithChildren } from "react";

import { Header, MobileNav } from "@/widgets/header";
import { CommandPaletteProvider } from "@/features/command-palette";
import { BrowserBackButton } from "@/shared/components/browser-back-button";
import { getOptionalServerUserId } from "@/shared/lib/app/auth";

export default async function GameDetailsLayout({
  children,
}: PropsWithChildren) {
  const userId = await getOptionalServerUserId();
  return (
    <CommandPaletteProvider>
      <Header isAuthorised={userId !== null} />
      <div className="px-lg py-3xl md:pb-3xl container mx-auto pb-24">
        <BrowserBackButton />
        <div className="mx-auto max-w-5xl">{children}</div>
      </div>
      {userId && <MobileNav />}
    </CommandPaletteProvider>
  );
}
