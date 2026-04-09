"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  CommandPalette,
  useCommandPaletteContext,
} from "@/features/command-palette";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { Button } from "@/shared/components/ui/button";

export function Header({ isAuthorised }: { isAuthorised: boolean }) {
  const { isOpen, open, close } = useCommandPaletteContext();
  const pathname = usePathname();
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(navigator.platform?.includes("Mac") ?? false);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  if (isAuthorised) {
    return (
      <>
        <header className="bg-background/60 border-border/10 py-lg md:py-xl y2k-glass-strong y2k:border-b-0 y2k:shadow-[0_1px_0_oklch(0.72_0.22_145/0.15)] sticky top-0 z-50 border-b backdrop-blur-2xl">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="heading-md md:heading-xl tracking-tight">
              <Link
                href="/dashboard"
                className="gap-md md:gap-lg flex items-center"
              >
                <Image
                  src="/logo.svg"
                  alt="SavePoint Logo"
                  width={40}
                  height={40}
                  className="y2k-logo-glow h-8 w-8 md:h-10 md:w-10"
                />
                <span className="y2k-chrome-text y2k:tracking-wider">
                  SavePoint
                </span>
              </Link>
            </h1>
            <nav className="gap-lg md:gap-2xl flex items-center">
              <div className="gap-2xl hidden items-center md:flex">
                <Link
                  href="/dashboard"
                  className={`body-sm transition-all ${isActive("/dashboard") ? "text-foreground y2k-neon-text y2k-neon-underline font-semibold" : "text-muted-foreground hover:text-foreground y2k:hover:text-primary/70 font-medium"}`}
                  aria-current={isActive("/dashboard") ? "page" : undefined}
                >
                  Dashboard
                </Link>
                <Link
                  href="/library"
                  className={`body-sm transition-all ${isActive("/library") ? "text-foreground y2k-neon-text y2k-neon-underline font-semibold" : "text-muted-foreground hover:text-foreground y2k:hover:text-primary/70 font-medium"}`}
                  aria-current={isActive("/library") ? "page" : undefined}
                >
                  Library
                </Link>
                <Link
                  href="/journal"
                  className={`body-sm transition-all ${isActive("/journal") ? "text-foreground y2k-neon-text y2k-neon-underline font-semibold" : "text-muted-foreground hover:text-foreground y2k:hover:text-primary/70 font-medium"}`}
                  aria-current={isActive("/journal") ? "page" : undefined}
                >
                  Journal
                </Link>
                <Link
                  href="/profile"
                  className={`body-sm transition-all ${isActive("/profile") ? "text-foreground y2k-neon-text y2k-neon-underline font-semibold" : "text-muted-foreground hover:text-foreground y2k:hover:text-primary/70 font-medium"}`}
                  aria-current={isActive("/profile") ? "page" : undefined}
                >
                  Profile
                </Link>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={open}
                aria-label="Search games (Cmd+K)"
                className="relative"
              >
                <Search className="h-5 w-5" />
                <kbd className="bg-muted text-muted-foreground pointer-events-none absolute -right-1 -bottom-1 hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
                  {isMac ? "⌘K" : "Ctrl+K"}
                </kbd>
              </Button>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <CommandPalette isOpen={isOpen} onClose={close} />
      </>
    );
  }
  return (
    <>
      <header className="bg-background/60 border-border/10 py-lg md:py-xl y2k-glass-strong y2k:border-b-0 y2k:shadow-[0_1px_0_oklch(0.72_0.22_145/0.15)] sticky top-0 z-50 border-b backdrop-blur-2xl">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="heading-md md:heading-xl tracking-tight">
            <Link
              href="/dashboard"
              className="gap-md md:gap-lg flex items-center"
            >
              <Image
                src="/logo.svg"
                alt="SavePoint Logo"
                width={40}
                height={40}
                className="y2k-logo-glow h-8 w-8 md:h-10 md:w-10"
              />
              <span className="y2k-chrome-text y2k:tracking-wider">
                SavePoint
              </span>
            </Link>
          </h1>
          <nav className="gap-lg md:gap-2xl flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={open}
              aria-label="Search games (Cmd+K)"
              className="relative"
            >
              <Search className="h-5 w-5" />
              <kbd className="bg-muted text-muted-foreground pointer-events-none absolute -right-1 -bottom-1 hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
                {isMac ? "⌘K" : "Ctrl+K"}
              </kbd>
            </Button>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <CommandPalette isOpen={isOpen} onClose={close} />
    </>
  );
}
