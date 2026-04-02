import type { PropsWithChildren } from "react";

import { Header, MobileNav } from "@/widgets/header";
import { CommandPaletteProvider } from "@/features/command-palette";
import { getOptionalServerUserId } from "@/shared/lib/app/auth";

export default async function PublicProfileLayout({
  children,
}: PropsWithChildren) {
  const userId = await getOptionalServerUserId();
  return (
    <CommandPaletteProvider>
      <Header isAuthorised={userId !== null} />
      <main
        id="main-content"
        className="px-lg pt-lg md:px-2xl md:pb-lg container mx-auto pb-36"
      >
        {children}
      </main>
      {userId && <MobileNav />}
    </CommandPaletteProvider>
  );
}
