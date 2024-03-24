import { Gamepad } from "lucide-react";

import { MobileNav } from "@/components/mobile-nav";
import { NavLink } from "@/components/nav-link";

import type { MainNavProps } from "@/types/ui";
import { siteConfig } from "@/config/site";

function Logo({ name }: { name: string }) {
  return (
    <div className="flex items-center space-x-2">
      <Gamepad className="size-6" />
      <span className="inline-block font-bold">{name}</span>
    </div>
  );
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
  );
}
