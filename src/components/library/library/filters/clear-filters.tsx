"use client";

import { Button } from "@/src/components/ui/button";
import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
    <Button onClick={onClick} variant="ghost">
      <X className="mr-1 size-4" />
      Clear filters
    </Button>
  );
};
