"use client";

import { XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Button } from "@/shared/components/ui/button";

export function ClearFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const onClearFilters = useCallback(() => {
    const paramsToUpdate = new URLSearchParams(params);
    const viewMode = params.get("viewMode");
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

  if (params.size === 0) return null;

  if (params.get("page") && params.size === 1) return null;

  return (
    <Button
      variant="outline"
      onClick={onClearFilters}
      type="button"
      aria-label="Clear filters"
      size="sm"
    >
      Clear filters
      <XIcon className="ml-2 size-4" />
    </Button>
  );
}
