import type { PropsWithChildren } from "react";

import { ProfileTabNav } from "@/features/profile";

type TabsLayoutProps = PropsWithChildren<{
  params: Promise<{ username: string }>;
}>;

export default async function ProfileTabsLayout({
  children,
  params,
}: TabsLayoutProps) {
  const { username } = await params;

  return (
    <>
      <ProfileTabNav username={username} />
      {children}
    </>
  );
}
