"use client";

import { BacklogStatusMapper } from "@/src/shared/lib";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/ui/select";
import { BacklogItemStatus } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function StatusFilter() {
  const params = useSearchParams();
  const router = useRouter();

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

      router.replace(`/collection/?${paramsToUpdate.toString()}`);
    },
    [router, params]
  );

  return (
    <Select onValueChange={onStatusSelect} value={params.get("status") ?? ""}>
      <SelectTrigger className="max-w-[260px]" aria-label="backlogStatus">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="All">All</SelectItem>
        {Object.keys(BacklogItemStatus).map((key) => (
          <SelectItem value={key} key={key}>
            {BacklogStatusMapper[key as unknown as BacklogItemStatus]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
