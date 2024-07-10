"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/src/shared/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/shared/ui/dropdown-menu";
import { ThemeToggle } from "@/src/widgets/theme-toggle";
import { useSession } from "next-auth/react";
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
        <Avatar className="size-9 cursor-pointer rounded">
          {session.data.user.image ? (
            <AvatarImage
              src={session.data.user.image ?? ""}
              alt={session.data.user.email ?? ""}
            />
          ) : null}
          <AvatarFallback className="size-9 cursor-pointer rounded">
            {getFirstTwoLiterals(session.data.user.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <ThemeToggle />
        <DropdownMenuItem>
          <Link href={`/user/${session.data.user.id}`}>Settings</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

User.displayName = "User";

export { User };
