import { User } from "@/src/entities/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/shared/ui/dropdown-menu";
import { AddGameLink } from "@/src/widgets/add-game-link";
import { AppLink } from "@/src/widgets/app-link";
import { GamepadIcon, MenuIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

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
    href: "/backlogs",
    label: "Backlogs",
  },
  {
    href: "/changelog",
    label: "Changelog",
  },
] as const;

export function Header() {
  return (
    <header className="w-full mx-auto flex items-center justify-between px-4 py-3 md:px-6 lg:px-8 fixed top-0 z-20 bg-background mb-[60px]">
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
            <GamepadIcon className="mr-2 size-6" />
            PlayLater
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
    </header>
  );
}
