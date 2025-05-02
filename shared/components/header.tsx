import { User } from "@/features/manage-user-info/components/user";
import { AddGameLink } from "@/shared/components/add-game-link";
import { AppLink } from "@/shared/components/app-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/dropdown-menu";
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
    <header className="fixed top-0 z-20 mb-[60px] w-full bg-gradient-to-b from-gray-900 via-gray-900/60 to-transparent py-3">
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
            <h1 className="mr-4 flex items-center font-bold md:text-lg xl:text-xl">
              <GamepadIcon className="mr-2 size-6 text-green-500" />
              <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                PlayLater
              </span>
            </h1>
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
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

export { Header };
