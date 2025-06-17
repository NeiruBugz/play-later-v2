"use client";

import { Tabs, TabsList, TabsTrigger } from "@/shared/components/tabs";
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
    <Tabs
      defaultValue={currentStatusParam || "All"}
      value={currentStatusParam || "All"}
      onValueChange={(value) => onStatusSelect(value)}
      className="w-full sm:w-auto"
    >
      <TabsList className="grid w-full grid-cols-5 sm:w-auto">
        <TabsTrigger value="All">All</TabsTrigger>
        <TabsTrigger value="TO_PLAY">Backlog</TabsTrigger>
        <TabsTrigger value="PLAYED">Played</TabsTrigger>
        <TabsTrigger value="PLAYING">Playing</TabsTrigger>
        <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
