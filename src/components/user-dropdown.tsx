import userPic from "@/images/userpic.png";
import { getUserData } from "@/src/actions/auth/actions";
import { SignOut } from "@/src/components/sign-out";
import { ThemeToggle } from "@/src/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { UserSettings } from "@/src/components/user-settings";
import Image from "next/image";

export async function UserDropdown({ username }: { username?: string }) {
  const userData = await getUserData();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Image
          alt={`${username} default user avatar`}
          className="cursor-pointer rounded"
          height={36}
          src={userPic}
          width={36}
        />
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
