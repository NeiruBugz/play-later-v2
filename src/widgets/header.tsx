import Link from "next/link";
import React from "react";

export function Header() {
  return (
    <header className="container py-2">
      <Link href="/">
        <h1 className="font-bold md:text-lg xl:text-xl inline">PlayLater</h1>
      </Link>
    </header>
  );
}
