import Link from "next/link"
import { Gamepad } from "lucide-react"

import { NavItem } from "@/types/nav"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { MobileNav } from "@/components/mobile-nav"
import { NavLink } from "@/components/nav-link"

interface MainNavProps {
  items: NavItem[]
}

function Logo({ name }: { name: string }) {
  return (
    <div className="flex items-center space-x-2">
      <Gamepad className="h-6 w-6" />
      <span className="inline-block font-bold">{name}</span>
    </div>
  )
}

export function MainNav({ items }: MainNavProps) {
  return (
    <>
      <div className="md:hidden">
        <MobileNav items={items} trigger={<Logo name={siteConfig.name} />} />
      </div>
      <div className="hidden gap-6 md:flex md:gap-10">
        <Logo name={siteConfig.name} />

        <nav className="flex gap-6">
          {items.map((item, index) => (
            <NavLink item={item} key={`${index}_${item.title}_nav`} />
          ))}
        </nav>
      </div>
    </>
  )
}
