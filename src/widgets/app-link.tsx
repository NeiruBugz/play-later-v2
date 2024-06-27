"use client";

import { cn } from "@/src/shared/lib";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      className={cn("cursor-pointer hover:underline", {
        "font-bold": pathname === href,
      })}
    >
      {label}
    </Link>
  );
}
