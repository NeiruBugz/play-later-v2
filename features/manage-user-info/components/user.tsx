"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/dropdown-menu";
import { ExitIcon } from "@radix-ui/react-icons";
import { Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { memo } from "react";

const getFirstTwoLiterals = (name: string | null | undefined) => {
  if (!name) {
    return "U";
  }

  const [firstName, lastName] = name.split(" ");

  return firstName.charAt(0).toUpperCase() + lastName?.charAt(0).toUpperCase();
};

const User = memo(function User() {
  const session = useSession();

  if (!session.data || !session.data.user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 cursor-pointer rounded">
          {session.data.user.image ? (
            <AvatarImage
              src={session.data.user.image ?? ""}
              alt={session.data.user.email ?? ""}
            />
          ) : null}
          <AvatarFallback className="size-8 cursor-pointer rounded">
            {getFirstTwoLiterals(session.data.user.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <Settings />
          <Link href={`/user/settings`}>Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
          <ExitIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

User.displayName = "User";

export { User };
