"use client"

import { PropsWithChildren } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NavItem } from "@/types/nav"
import { cn } from "@/lib/utils"

function NavLink({ item, children }: PropsWithChildren<{ item: NavItem }>) {
  const pathname = usePathname()

  const isActive =
    item.href && pathname.toLowerCase().includes(item.href.toLowerCase())

  return item.href ? (
    <Link
      href={item.href}
      className={cn(
        "flex items-center text-pretty font-medium text-muted-foreground",
        {
          "cursor-not-allowed opacity-80": item.disabled,
          "font-bold text-foreground": isActive,
        }
      )}
      target={item.external ? "_blank" : "_parent"}
    >
      {children ? children : item.title}
    </Link>
  ) : null
}

export { NavLink }
