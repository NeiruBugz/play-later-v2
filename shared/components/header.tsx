import { GamepadIcon, Library, ListChecks, MenuIcon, Plus } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";

import { User } from "@/features/manage-user-info/components/user";
import { ThemeToggle } from "@/features/theme-toggle/components/theme-toggle";
import { ResponsiveHeading } from "@/shared/components/typography";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/shared/lib";

const linksConfig = [
  {
    href: "/collection?status=PLAYING&page=1",
    label: "Collection",
    icon: Library,
    mobileLabel: "Collection",
  },
  {
    href: "/backlog",
    label: "Backlogs",
    icon: ListChecks,
    mobileLabel: "Backlogs",
  },
] as const;

const Header = memo(({ authorized }: { authorized: boolean }) => {
  return (
    <header className="fixed top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {authorized ? (
          <div className={cn("mr-4 flex md:hidden")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MenuIcon className="size-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {linksConfig.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link
                        href={link.href}
                        className="flex items-center gap-2"
                      >
                        <IconComponent className="size-4" />
                        {link.mobileLabel}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}

        <div className="mr-4 flex items-center space-x-2 lg:mr-6">
          <Link href="/" className="flex items-center space-x-2">
            <GamepadIcon className="size-5 text-green-500 sm:size-6" />
            <ResponsiveHeading
              level={1}
              className="hidden font-bold sm:inline-block lg:text-heading-sm"
            >
              PlayLater
            </ResponsiveHeading>
            <span className="text-sm font-bold sm:hidden">PL</span>
          </Link>
        </div>

        {authorized ? (
          <nav className="hidden flex-1 items-center space-x-2 md:flex lg:space-x-4">
            {linksConfig.map((link) => {
              const IconComponent = link.icon;
              return (
                <Button
                  key={link.href}
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 px-2 lg:px-3"
                >
                  <Link href={link.href} className="flex items-center gap-2">
                    <IconComponent className="size-4" />
                    <span className="hidden lg:inline">{link.label}</span>
                  </Link>
                </Button>
              );
            })}
          </nav>
        ) : null}

        {authorized ? (
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button variant="default" size="sm" asChild className="h-8">
              <Link
                href="/collection/add-game"
                className="flex items-center gap-2"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Game</span>
              </Link>
            </Button>

            <User />

            <ThemeToggle />
          </div>
        ) : null}
      </div>
    </header>
  );
});

Header.displayName = "Header";

export { Header };
