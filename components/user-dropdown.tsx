import { getUserData } from "@/app/login/lib/actions";
import { SignOut } from "@/components/sign-out";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserSettings } from "@/components/user-settings";
import userPic from "@/images/userpic.png";
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
