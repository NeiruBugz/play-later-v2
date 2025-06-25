"use client";

import { Button } from "@/shared/components";
import { Grid3X3, List } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function CollectionViewMode() {
  const params = useSearchParams();
  const router = useRouter();

  const currentViewMode = params.get("viewMode") || "grid";

  const handleViewModeChange = useCallback(
    (value: string | null) => {
      if (!value) {
        return;
      }

      const paramsToUpdate = new URLSearchParams(params);

      paramsToUpdate.set("viewMode", value);
      paramsToUpdate.set("page", "1");

      router.replace(`/collection/?${paramsToUpdate.toString()}`);
    },
    [router, params]
  );

  return (
    <div className="flex items-center gap-1 rounded-lg border p-1">
      <Button
        variant={currentViewMode === "grid" ? "default" : "ghost"}
        size="sm"
        className="h-8 px-3"
        onClick={() => handleViewModeChange("grid")}
      >
        <Grid3X3 className="h-4 w-4" />
        <span className="sr-only">Grid view</span>
      </Button>
      <Button
        variant={currentViewMode === "list" ? "default" : "ghost"}
        size="sm"
        className="h-8 px-3"
        onClick={() => handleViewModeChange("list")}
      >
        <List className="h-4 w-4" />
        <span className="sr-only">List view</span>
      </Button>
    </div>
  );
}
