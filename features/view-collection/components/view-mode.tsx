"use client";

import { Grid3X3, List } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Button } from "@/shared/components/ui/button";

export function CollectionViewMode() {
  const params = useSearchParams();
  const router = useRouter();

  const currentViewMode = params.get("viewMode") ?? "grid";

  const handleViewModeChange = useCallback(
    (value: string) => {
      const paramsToUpdate = new URLSearchParams(params);
      paramsToUpdate.set("viewMode", value);
      paramsToUpdate.set("page", "1");
      router.replace(`/collection/?${paramsToUpdate.toString()}`);
    },
    [router, params]
  );

  return (
    <div className="flex items-center gap-1 rounded-md bg-muted p-1">
      <Button
        variant={currentViewMode === "grid" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-3"
        onClick={() => handleViewModeChange("grid")}
        aria-label="Grid view"
      >
        <Grid3X3 className="size-4" />
      </Button>
      <Button
        variant={currentViewMode === "list" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-3"
        onClick={() => handleViewModeChange("list")}
        aria-label="List view"
      >
        <List className="size-4" />
      </Button>
    </div>
  );
}
