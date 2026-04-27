"use client";

import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/shared/components/theme-toggle";

export function Header({ isAuthorised }: { isAuthorised: boolean }) {
  if (isAuthorised) {
    return (
      <header className="bg-background/60 border-border/10 py-lg y2k-glass-strong y2k:border-b-0 y2k:shadow-[0_1px_0_oklch(0.72_0.22_145/0.15)] jewel-glass-strong jewel:border-b-0 jewel:shadow-[0_1px_0_oklch(0.72_0.22_145/0.25),0_8px_32px_oklch(0_0_0/0.5)] sticky top-0 z-50 border-b backdrop-blur-2xl">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-h3 tracking-tight">
            <Link href="/dashboard" className="gap-md flex items-center">
              <Image
                src="/logo.svg"
                alt="SavePoint Logo"
                width={32}
                height={32}
                className="y2k-logo-glow jewel-logo-glow h-8 w-8"
              />
              <span className="y2k-chrome-text y2k:tracking-wider jewel-display jewel:tracking-[0.14em]">
                SavePoint
              </span>
            </Link>
          </h1>
          <nav className="flex items-center">
            <ThemeToggle />
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-background/60 border-border/10 py-lg md:py-xl y2k-glass-strong y2k:border-b-0 y2k:shadow-[0_1px_0_oklch(0.72_0.22_145/0.15)] sticky top-0 z-50 border-b backdrop-blur-2xl">
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-h3 md:text-h1 tracking-tight">
          <Link
            href="/dashboard"
            className="gap-md md:gap-lg flex items-center"
          >
            <Image
              src="/logo.svg"
              alt=""
              aria-hidden="true"
              width={40}
              height={40}
              className="y2k-logo-glow h-8 w-8 md:h-10 md:w-10"
            />
            <span className="y2k-chrome-text y2k:tracking-wider">
              SavePoint
            </span>
          </Link>
        </h1>
        <nav className="flex items-center">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
