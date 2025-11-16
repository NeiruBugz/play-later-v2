import { PropsWithChildren } from "react";

import { BrowserBackButton } from "@/shared/components/browser-back-button";
import { Header } from "@/shared/components/header";
import { getOptionalServerUserId } from "@/shared/lib/app/auth";

export default async function GameDetailsLayout({
  children,
}: PropsWithChildren) {
  const userId = await getOptionalServerUserId();
  return (
    <>
      <Header isAuthorised={userId !== null} />
      <div className="container mx-auto px-4 py-8">
        <BrowserBackButton />
        <div className="mx-auto max-w-5xl">{children}</div>
      </div>
    </>
  );
}
