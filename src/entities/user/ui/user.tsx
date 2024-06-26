"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/src/shared/ui/avatar";
import { useSession } from "next-auth/react";
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
    <Avatar>
      {session.data.user.image ? (
        <AvatarImage
          src={session.data.user.image ?? ""}
          alt={session.data.user.email ?? ""}
        />
      ) : null}
      <AvatarFallback>
        {getFirstTwoLiterals(session.data.user.name)}
      </AvatarFallback>
    </Avatar>
  );
});

User.displayName = "User";

export { User };
