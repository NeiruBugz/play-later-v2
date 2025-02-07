"use client";

import { BacklogItemStatus } from "@/domain/entities/BacklogItem";
import { BacklogStatusMapper } from "@/lib/enum-mappers";
import { Button, Wrap } from "@chakra-ui/react";
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
    [router, params],
  );

  return (
    <Wrap spaceX={1}>
      <Button
        onClick={() => onStatusSelect("All")}
        disabled={!currentStatusParam}
        size="sm"
        variant="outline"
      >
        All
      </Button>
      {Object.keys(BacklogStatusMapper)
        .filter((key) => key !== "WISHLIST")
        .map((key) => (
          <Button
            key={key}
            onClick={() => onStatusSelect(key)}
            disabled={currentStatusParam === key}
            size="sm"
            variant="outline"
          >
            {BacklogStatusMapper[key as BacklogItemStatus]}
          </Button>
        ))}
    </Wrap>
  );
}
