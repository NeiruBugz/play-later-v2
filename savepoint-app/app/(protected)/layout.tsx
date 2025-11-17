import type { PropsWithChildren } from "react";
import { Header } from "@/shared/components/header";
import { Toaster } from "@/shared/components/ui/sonner";
import { requireServerUserId } from "@/shared/lib/app/auth";
export const dynamic = "force-dynamic";
export default async function ProtectedLayout({ children }: PropsWithChildren) {
  const userId = await requireServerUserId();
  return (
    <>
      <Header isAuthorised={Boolean(userId)} />
      <main className="container mx-auto py-3">{children}</main>
      <Toaster />
    </>
  );
}
