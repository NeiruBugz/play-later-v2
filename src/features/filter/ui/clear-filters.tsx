"use client";

import { Button } from "@/src/shared/ui";
import { XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";


export function ClearFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const onClearFilters = useCallback(() => {
    const paramsToUpdate = new URLSearchParams(params);
    const viewMode = params.get("viewMode");
    paramsToUpdate.delete("platform");
    paramsToUpdate.delete("status");
    paramsToUpdate.delete('search');
    paramsToUpdate.set('viewMode', viewMode ?? 'grid')
    router.replace(`/?${paramsToUpdate.toString()}`);
  }, [params, router]);

  if (params.size === 0) return null;

  if (params.get('viewMode') && params.size === 1) return null;

  return (
    <Button
      variant="outline"
      onClick={onClearFilters}
      type="button"
      aria-label="Clear filters"
    >
      Clear filters
      <XIcon className="ml-2 size-4" />
    </Button>
  );
}