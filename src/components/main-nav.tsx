import type { MainNavProps } from "@/src/types/shared/ui";

import { Logo } from "@/src/components/logo";
import { MobileNav } from "@/src/components/mobile-nav";
import { NavLink } from "@/src/components/nav-link";
import { siteConfig } from "@/src/lib/config/site";

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
