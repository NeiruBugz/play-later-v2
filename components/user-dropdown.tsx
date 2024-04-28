import Image from "next/image";
import userPic from "@/images/userpic.png";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOut } from "@/components/sign-out";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserSettings } from "@/components/user-settings";

import { getUserData } from "@/app/login/lib/actions";

export async function UserDropdown({ username }: { username?: string }) {
  const userData = await getUserData();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Image
          src={userPic}
          alt={`${username} default user avatar`}
          width={36}
          height={36}
          className="cursor-pointer rounded"
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
