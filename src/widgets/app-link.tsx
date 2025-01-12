"use client";

import { cn } from "@/src/shared/lib";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";

const AppLink = memo(function AppLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      className={cn("cursor-pointer text-base hover:underline", {
        "font-medium": href.includes(pathname),
      })}
    >
      {label}
    </Link>
  );
});

AppLink.displayName = "AppLink";
export { AppLink };
