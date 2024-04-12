"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

export const ClearFilters = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  if (searchParams?.size === 2 && searchParams.get("viewMode")) {
    return null;
  }

  const onClick = () => {
    replace(`${pathname}?status=BACKLOG`);
  };

  return (
    <Button variant="ghost" onClick={onClick}>
      <X className="mr-1 size-4" />
      Clear filters
    </Button>
  );
};
