import { SignOut } from "@/src/components/sign-out";
import { UserSettings } from "@/src/components/user-settings";
import { getUserData } from "@/src/entities/user/get-user-data";
import { Avatar, AvatarFallback } from "@/src/shared/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/shared/ui/dropdown-menu";
import { ThemeToggle } from "@/src/shared/ui/theme-toggle";

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
