"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Button } from "@/shared/components/ui/button";

const statusOptions = [
  { value: "All", label: "All" },
  { value: "TO_PLAY", label: "Backlog" },
  { value: "PLAYED", label: "Played" },
  { value: "PLAYING", label: "Playing" },
  { value: "COMPLETED", label: "Completed" },
] as const;

export function StatusFilter() {
  const params = useSearchParams();
  const router = useRouter();

  const currentStatus = params.get("status") ?? "All";

  const onStatusSelect = useCallback(
    (value: string) => {
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
    <div className="flex flex-wrap items-center gap-2">
      {statusOptions.map((option) => {
        const isActive = currentStatus === option.value;
        return (
          <Button
            key={option.value}
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onStatusSelect(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
