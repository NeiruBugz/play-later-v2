"use client";

import { Button } from "@/src/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";


export const ViewModeToggle = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const viewMode = searchParams?.get("viewMode") || "list";

  const onViewModeChange = useCallback(
    (mode: "grid" | "list") => {
      const newSearchParams = new URLSearchParams(
        searchParams ?? new URLSearchParams()
      );
      newSearchParams.set("viewMode", mode);
      if (pathname) {
        replace(`${pathname}?${newSearchParams}`);
      }
    },
    [pathname, replace, searchParams]
  );

  if (viewMode === "list") {
    return (
      <Button
        aria-label="toggle-view-mode-grid"
        onClick={() => onViewModeChange("grid")}
        size="icon"
        variant="outline"
      >
        <List className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      aria-label="toggle-view-mode-list"
      onClick={() => onViewModeChange("list")}
      size="icon"
      variant="outline"
    >
      <LayoutGrid className="size-4" />
    </Button>
  );
};
