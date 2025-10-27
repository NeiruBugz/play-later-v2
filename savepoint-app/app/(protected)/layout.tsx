import Link from "next/link";
import type { PropsWithChildren } from "react";

import { Toaster } from "@/shared/components/ui/sonner";

export default function ProtectedLayout({ children }: PropsWithChildren) {
  return (
    <>
      <header className="container mx-auto border-b border-gray-200 py-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl font-bold">
            <Link href="/dashboard">SavePoint</Link>
          </h1>
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/library"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
            >
              Library
            </Link>
            <Link
              href="/profile"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
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
