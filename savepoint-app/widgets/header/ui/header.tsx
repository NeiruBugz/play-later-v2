"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CommandPalette,
  useCommandPaletteContext,
} from "@/features/command-palette";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { Button } from "@/shared/components/ui/button";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/library", label: "Library" },
  { href: "/journal", label: "Journal" },
  { href: "/timeline", label: "Timeline" },
  { href: "/profile", label: "Profile" },
] as const;

export function Header({ isAuthorised }: { isAuthorised: boolean }) {
  const { isOpen, open, close } = useCommandPaletteContext();
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  if (isAuthorised) {
    return (
      <>
        <header className="bg-background/60 border-border/10 py-lg md:py-xl y2k-glass-strong y2k:border-b-0 y2k:shadow-[0_1px_0_oklch(0.72_0.22_145/0.15)] jewel-glass-strong jewel:border-b-0 jewel:shadow-[0_1px_0_oklch(0.72_0.22_145/0.25),0_8px_32px_oklch(0_0_0/0.5)] sticky top-0 z-50 border-b backdrop-blur-2xl">
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
                  className="y2k-logo-glow jewel-logo-glow h-8 w-8 md:h-10 md:w-10"
                />
                <span className="y2k-chrome-text y2k:tracking-wider jewel-display jewel:tracking-[0.14em]">
                  SavePoint
                </span>
              </Link>
            </h1>
            <nav className="gap-lg md:gap-2xl flex items-center">
              <div className="gap-2xl hidden items-center md:flex">
                {NAV_LINKS.map(({ href, label }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`body-sm jewel:uppercase jewel:tracking-[0.14em] jewel:text-[0.72rem] transition-all ${
                        active
                          ? "text-foreground y2k-neon-text y2k-neon-underline jewel-nav-active font-semibold"
                          : "text-muted-foreground hover:text-foreground y2k:hover:text-primary/70 jewel:hover:text-primary jewel-nav-inactive font-medium"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
              <Button
                variant="default"
                onClick={open}
                aria-label="Add Game"
                className="h-11 w-11 px-0 md:h-9 md:w-auto md:px-4"
              >
                <Plus className="h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />
                <span className="hidden md:inline">Add Game</span>
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
          <nav className="gap-lg md:gap-2xl flex items-center">
            <ThemeToggle />
          </nav>
        </div>
      </header>
    </>
  );
}
