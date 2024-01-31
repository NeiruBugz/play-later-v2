import { NavItem } from "@/types/nav"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NavLink } from "@/components/nav-link"

export function MobileNav({
  trigger,
  items,
}: {
  trigger: React.ReactNode
  items: NavItem[]
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {items.map(
          (item, index) =>
            item.href && (
              <NavLink key={`${index}_${item.title}_nav`} item={item}>
                <DropdownMenuItem>{item.title}</DropdownMenuItem>
              </NavLink>
            )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
