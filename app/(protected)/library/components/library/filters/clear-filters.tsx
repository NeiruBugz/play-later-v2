"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

export const ClearFilters = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  if (searchParams.size === 1) {
    return null;
  }

  const onClick = () => {
    replace(`${pathname}?status=BACKLOG`);
  };

  return (
    <Button variant="ghost" onClick={onClick}>
      Clear filters
    </Button>
  );
};
