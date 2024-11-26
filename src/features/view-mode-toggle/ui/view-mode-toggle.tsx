"use client"

import { Button } from "@/src/shared/ui";
import { Rows3Icon, LayoutGridIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, type MouseEvent } from "react";

export function ViewModeToggle() {
  const params = useSearchParams();
  const router = useRouter();
  const viewMode = params.get("viewMode");

  const onViewModeChange = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const viewMode = event.currentTarget.dataset.viewmode;

    if (!viewMode) {
      return;
    }

    const paramsToUpdate = new URLSearchParams(params);
    paramsToUpdate.set("viewMode", viewMode);
    router.replace(`/collection?${paramsToUpdate.toString()}`);
  }, [params, router])

  if (viewMode === 'grid' || !viewMode) {
    return (
      <Button variant="outline" data-viewmode="list" onClick={onViewModeChange}>
        <Rows3Icon />
      </Button>
    )
  }

  return (
    <Button variant="outline" data-viewmode="grid" onClick={onViewModeChange}>
      <LayoutGridIcon />
    </Button>
  )
}