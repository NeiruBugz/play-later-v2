"use client";

import { Button } from "@/src/shared/ui";
import { useSession } from "next-auth/react";
import Link from "next/link";

export function AddGameLink() {
  const session = useSession();

  if (!session) {
    return;
  }

  return (
    <Link
      href="/collection/add-game"
      className="cursor-pointer hover:underline"
    >
      <Button>Add Game</Button>
    </Link>
  );
}
