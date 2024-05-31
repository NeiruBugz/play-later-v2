"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/src/shared/ui/button";

export const ClearFilters = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { push } = useRouter();

  if (searchParams?.size <= 2) {
    return null;
  }

  const onClick = () => {
    push(`${pathname}?status=INPROGRESS`);
  };

  return (
    <Button onClick={onClick} variant="ghost">
      <X className="mr-1 size-4" />
      Clear filters
    </Button>
  );
};
