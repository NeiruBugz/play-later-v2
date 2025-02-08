"use client";

import { Button } from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function ClearFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const onClearFilters = useCallback(() => {
    const paramsToUpdate = new URLSearchParams(params);
    const page = params.get("page");
    paramsToUpdate.delete("platform");
    paramsToUpdate.delete("search");
    paramsToUpdate.delete("page");
    paramsToUpdate.set("status", "PLAYING");
    if (page) {
      paramsToUpdate.set("page", page);
    }
    router.replace(`/collection?${paramsToUpdate.toString()}`);
  }, [params, router]);

  if (params.size === 0 || (params.get("page") && params.size === 1))
    return null;

  return (
    <Button
      colorPalette="blue"
      variant="outline"
      onClick={onClearFilters}
      type="button"
      aria-label="Clear filters"
      size="sm"
    >
      Clear filters
    </Button>
  );
}
