"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components";
import { normalizeString } from "@/shared/lib";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export function PlatformFilter({
  platformOptions,
}: {
  platformOptions: (string | null)[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onPlatformSelect = useCallback(
    (value: string | null) => {
      if (!value) {
        return;
      }

      const paramsToUpdate = new URLSearchParams(params);

      if (value === "All") {
        paramsToUpdate.delete("platform");
      } else {
        paramsToUpdate.set("platform", value);
      }

      paramsToUpdate.set("page", "1");
      startTransition(() => {
        router.replace(`/collection/?${paramsToUpdate.toString()}`);
      });
    },
    [router, params]
  );

  return (
    <Select
      onValueChange={onPlatformSelect}
      value={params.get("platform") ?? ""}
      disabled={pending}
    >
      <SelectTrigger
        className="h-8 gap-1 md:max-w-[260px]"
        aria-label="platforms"
      >
        <SelectValue placeholder="Platform" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={"All"}>All</SelectItem>
        {platformOptions.map((platform) => (
          <SelectItem value={platform ?? ""} key={platform}>
            {normalizeString(platform as string)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
