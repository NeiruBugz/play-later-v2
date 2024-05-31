import type { ReactNode } from "react";

import type { NavItem } from "@/src/shared/types/shared";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/shared/ui/dropdown-menu";
import { NavLink } from "@/src/shared/ui/nav-link";

export function MobileNav({
  items,
  trigger,
}: {
  items: NavItem[];
  trigger: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {items.map(
          (item, index) =>
            item.href && (
              <NavLink item={item} key={`${index}_${item.title}_nav`}>
                <DropdownMenuItem>{item.title}</DropdownMenuItem>
              </NavLink>
            )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
