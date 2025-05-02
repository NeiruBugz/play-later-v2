"use client";

import { Button } from "@/shared/components";
import { BacklogStatusMapper } from "@/shared/lib";
import { BacklogItemStatus } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function StatusFilter() {
  const params = useSearchParams();
  const router = useRouter();

  const currentStatusParam = params.get("status");

  const onStatusSelect = useCallback(
    (value: string | null) => {
      if (!value) {
        return;
      }

      const paramsToUpdate = new URLSearchParams(params);

      if (value === "All") {
        paramsToUpdate.delete("status");
      } else {
        paramsToUpdate.set("status", value);
      }
      paramsToUpdate.set("page", "1");

      router.replace(`/collection/?${paramsToUpdate.toString()}`);
    },
    [router, params]
  );

  return (
    <div className="flex flex-wrap gap-1">
      <Button
        onClick={() => onStatusSelect("All")}
        disabled={!currentStatusParam}
        size="sm"
        variant="outline"
      >
        All
      </Button>
      {Object.keys(BacklogItemStatus)
        .filter((key) => key !== "WISHLIST")
        .map((key) => (
          <Button
            key={key}
            onClick={() => onStatusSelect(key)}
            disabled={currentStatusParam === key}
            size="sm"
            variant="outline"
          >
            {BacklogStatusMapper[key as unknown as BacklogItemStatus]}
          </Button>
        ))}
    </div>
  );
}
