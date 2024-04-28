import { NavLink } from "@/components/nav-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavItem } from "@/lib/types/nav";
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
