import { User } from "@/src/entities/user";
import { Button } from "@/src/shared/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/shared/ui/dropdown-menu";
import { AppLink } from "@/src/widgets/app-link";
import { GamepadIcon, MenuIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

const linksConfig = [
  {
    href: "/collection",
    label: "Collection",
  },
  {
    href: "/wishlist",
    label: "Wishlist",
  },
  {
    href: "/changelog",
    label: "Changelog",
  },
] as const;

export function Header() {
  return (
    <header className="container mx-auto flex items-center justify-between px-4 py-3 md:px-6 lg:px-8">
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
          <h1 className="mr-4 font-bold md:text-lg xl:text-xl flex items-center">
            <GamepadIcon className="size-6 mr-2"/>PlayLater
          </h1>
        </Link>
        <div className="hidden items-center gap-3 md:flex">
          {linksConfig.map((link) => {
            return <AppLink {...link} key={link.href} />;
          })}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/collection/add-game"
          className="cursor-pointer hover:underline"
        >
          <Button>Add Game</Button>
        </Link>
        <User />
      </div>
    </header>
  );
}
