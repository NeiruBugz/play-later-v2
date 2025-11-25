import { PropsWithChildren } from "react";

import { BrowserBackButton } from "@/shared/components/browser-back-button";
import { Header } from "@/shared/components/header";
import { MobileNav } from "@/shared/components/mobile-nav";
import { getOptionalServerUserId } from "@/shared/lib/app/auth";

export default async function GameDetailsLayout({
  children,
}: PropsWithChildren) {
  const userId = await getOptionalServerUserId();
  return (
    <>
      <Header isAuthorised={userId !== null} />
      <div className="container mx-auto px-lg py-3xl pb-24 md:pb-3xl">
        <BrowserBackButton />
        <div className="mx-auto max-w-5xl">{children}</div>
      </div>
      {userId && <MobileNav />}
    </>
  );
}
