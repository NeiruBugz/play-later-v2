"use client";

import { Button } from "@/src/shared/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function ClearFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const onClearFilters = useCallback(() => {
    const paramsToUpdate = new URLSearchParams(params);

    paramsToUpdate.delete("platform");
    paramsToUpdate.delete("status");
    router.replace(`/?${paramsToUpdate.toString()}`);
  }, [params, router]);

  if (params.size === 0) return null;

  return (
    <Button
      variant="outline"
      onClick={onClearFilters}
      type="button"
      aria-label="Clear filters"
    >
      Clear filters
    </Button>
  );
}