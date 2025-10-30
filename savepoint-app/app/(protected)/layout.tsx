import Link from "next/link";
import type { PropsWithChildren } from "react";

import { Toaster } from "@/shared/components/ui/sonner";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: PropsWithChildren) {
  await requireServerUserId();

  return (
    <>
      <header className="border-border container mx-auto border-b py-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl font-bold">
            <Link href="/dashboard">SavePoint</Link>
          </h1>
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/library"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Library
            </Link>
            <Link
              href="/profile"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Profile
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto py-3">{children}</main>
      <Toaster />
    </>
  );
}
