"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useCommandPaletteContext } from "@/features/command-palette";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { cn } from "@/shared/lib/ui/utils";

export function MobileTopbar() {
  const { open } = useCommandPaletteContext();

  return (
    <header
      className={cn(
        "py-lg sticky top-0 z-50 border-b backdrop-blur-2xl md:hidden",
        "bg-background/60 border-border/10",
        "y2k-glass-strong y2k:border-b-0 y2k:shadow-[0_1px_0_oklch(0.72_0.22_145/0.15)]",
        "jewel-glass-strong jewel:border-b-0 jewel:shadow-[0_1px_0_oklch(0.72_0.22_145/0.25),0_8px_32px_oklch(0_0_0/0.5)]"
      )}
    >
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
        <nav className="gap-xs flex items-center">
          <button
            type="button"
            onClick={open}
            aria-label="Open search"
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-lg",
              "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              "duration-fast transition-colors",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
            )}
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
