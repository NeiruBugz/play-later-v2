import type { PropsWithChildren } from "react";

import { Header, MobileNav } from "@/widgets/header";
import { CommandPaletteProvider } from "@/features/command-palette";
import { getOptionalServerUserId } from "@/shared/lib/app/auth";

export default async function GameDetailsLayout({
  children,
}: PropsWithChildren) {
  const userId = await getOptionalServerUserId();
  return (
    <CommandPaletteProvider>
      <Header isAuthorised={userId !== null} />
      <div className="md:pb-3xl pb-24">{children}</div>
      {userId && <MobileNav />}
    </CommandPaletteProvider>
  );
}
