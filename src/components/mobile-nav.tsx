import type { NavItem } from "@/src/types/shared";

import { NavLink } from "@/src/components/nav-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { type ReactNode } from "react";

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
