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
    <div className="flex items-center gap-2">
      <Button
        variant={currentViewMode === "grid" ? "default" : "outline"}
        size="icon"
        className="h-9 w-9"
        onClick={() => handleViewModeChange("grid")}
        disabled
      >
        <Grid3X3 className="h-4 w-4" />
        <span className="sr-only">Grid view</span>
      </Button>
      <Button
        variant={currentViewMode === "list" ? "default" : "outline"}
        size="icon"
        className="h-9 w-9"
        onClick={() => handleViewModeChange("list")}
        disabled
      >
        <List className="h-4 w-4" />
        <span className="sr-only">List view</span>
      </Button>
    </div>
  );
}
