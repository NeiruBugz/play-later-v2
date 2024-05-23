import { SignOut } from "@/src/components/sign-out";
import { ThemeToggle } from "@/src/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { UserSettings } from "@/src/components/user-settings";
import { getUserData } from "@/src/queries/auth";

export async function UserDropdown({ username }: { username?: string }) {
  const userData = await getUserData();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar>
          <AvatarFallback>{username ? username[0] : "U"}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <UserSettings userData={userData} />
        <ThemeToggle />
        <DropdownMenuSeparator />
        <SignOut />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
