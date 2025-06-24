import { User } from "@/features/manage-user-info/components/user";
import { ThemeToggle } from "@/features/theme-toggle/components/theme-toggle";
import { AddGameLink } from "@/shared/components/add-game-link";
import { AppLink } from "@/shared/components/app-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/dropdown-menu";
import { ResponsiveHeading } from "@/shared/components/typography";
import { GamepadIcon, MenuIcon } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";

const linksConfig = [
  {
    href: "/collection?status=PLAYING&page=1",
    label: "Collection",
  },
  {
    href: "/wishlist",
    label: "Wishlist",
  },
  {
    href: "/backlog",
    label: "Backlogs",
  },
  {
    href: "/changelog",
    label: "Changelog",
  },
] as const;

const Header = memo(function Header() {
  return (
    <header className="fixed top-0 z-20 w-full bg-background py-3 shadow-sm">
      <div className="container flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="block md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <MenuIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {linksConfig.map((link) => {
                  return (
                    <DropdownMenuItem key={link.href}>
                      <AppLink {...link} />
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Link href="/">
            <ResponsiveHeading
              level={1}
              className="md:text-heading-sm xl:text-heading-md mr-4 flex items-center"
            >
              <GamepadIcon className="mr-2 size-6 text-green-500" />
              <span>PlayLater</span>
            </ResponsiveHeading>
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            {linksConfig.map((link) => {
              return <AppLink {...link} key={link.href} />;
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <AddGameLink />
          <User />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

export { Header };
