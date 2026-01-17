"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  CommandPalette,
  useCommandPaletteContext,
} from "@/shared/components/command-palette";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { Button } from "@/shared/components/ui/button";

export function Header({ isAuthorised }: { isAuthorised: boolean }) {
  const { isOpen, open, close } = useCommandPaletteContext();
  if (isAuthorised) {
    return (
      <>
        <header className="border-border py-lg md:py-xl container mx-auto border-b">
          <div className="flex items-center justify-between">
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
                  className="h-8 w-8 md:h-10 md:w-10"
                />
                <span>SavePoint</span>
              </Link>
            </h1>
            <nav className="gap-lg md:gap-2xl flex items-center">
              <div className="gap-2xl hidden items-center md:flex">
                <Link
                  href="/dashboard"
                  className="body-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/library"
                  className="body-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  Library
                </Link>
                <Link
                  href="/journal"
                  className="body-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  Journal
                </Link>
                <Link
                  href="/profile"
                  className="body-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
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
                  ⌘K
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
      <header className="border-border py-lg md:py-xl container mx-auto border-b">
        <div className="flex items-center justify-between">
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
                className="h-8 w-8 md:h-10 md:w-10"
              />
              <span>SavePoint</span>
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
                ⌘K
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
