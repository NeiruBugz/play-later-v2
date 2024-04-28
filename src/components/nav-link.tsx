"use client";

import type { NavItem } from "@/src/types/shared";

import { cn } from "@/src/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

export function NavLink({
  children,
  item,
}: PropsWithChildren<{ item: NavItem }>) {
  const pathname = usePathname();

  const isActive =
    item.href && pathname?.toLowerCase().includes(item.href.toLowerCase());

  return item.href ? (
    <Link
      className={cn(
        "flex items-center text-pretty font-medium text-muted-foreground hover:underline hover:underline-offset-1",
        {
          "cursor-not-allowed opacity-80": item.disabled,
          "font-bold text-foreground": isActive,
        }
      )}
      href={item.href}
      target={item.external ? "_blank" : "_parent"}
    >
      {children ? children : item.title}
    </Link>
  ) : null;
}
