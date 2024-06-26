import { User } from "@/src/entities/user";
import Link from "next/link";
import React from "react";

export function Header() {
  return (
    <header className="container mx-auto flex items-center justify-between px-4 py-2 md:px-6 lg:px-8">
      <Link href="/">
        <h1 className="inline font-bold md:text-lg xl:text-xl">PlayLater</h1>
      </Link>
      <User />
    </header>
  );
}
