import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { NavLink } from "@/components/nav-link";

import type { MainNavProps } from "@/types/ui";
import { siteConfig } from "@/config/site";

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
