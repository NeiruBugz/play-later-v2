"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";

import { cn } from "@/shared/lib";

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
      className={cn(
        "cursor-pointer text-base text-foreground hover:underline",
        {
          "font-medium": href.includes(pathname),
        }
      )}
    >
      {label}
    </Link>
  );
});

AppLink.displayName = "AppLink";
export { AppLink };
