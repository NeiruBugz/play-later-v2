import { siteConfig } from "@/src/shared/config/site";
import type { MainNavProps } from "@/src/shared/types/shared/ui";
import { Logo } from "@/src/shared/ui/logo";
import { MobileNav } from "@/src/shared/ui/mobile-nav";
import { NavLink } from "@/src/shared/ui/nav-link";

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
