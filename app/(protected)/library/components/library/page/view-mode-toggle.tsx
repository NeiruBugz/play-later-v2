"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";

import { Button } from "@/components/ui/button";

export const ViewModeToggle = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const viewMode = searchParams?.get("viewMode") || "list";

  const onViewModeChange = useCallback(
    (mode: "list" | "grid") => {
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
        size="icon"
        variant="outline"
        onClick={() => onViewModeChange("grid")}
      >
        <List className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={() => onViewModeChange("list")}
    >
      <LayoutGrid className="size-4" />
    </Button>
  );
};
