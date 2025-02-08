"use client";

import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { normalizeString } from "@/lib/normalize-string";
import { createListCollection } from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

const mapStringToCollection = (options: { platform: string }[]) =>
  createListCollection({
    items: options.map((option) => ({
      label: normalizeString(option.platform),
      value: option.platform,
    })),
  });

export function PlatformFilter({
  platformOptions,
}: {
  platformOptions: { platform: string }[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onPlatformSelect = useCallback(
    (value: string[]) => {
      if (!value || !value.length) {
        return;
      }

      const [platform] = value;

      const paramsToUpdate = new URLSearchParams(params);

      if (platform === "All") {
        paramsToUpdate.delete("platform");
      } else {
        paramsToUpdate.set("platform", platform);
      }

      paramsToUpdate.set("page", "1");
      startTransition(() => {
        router.replace(`/collection/?${paramsToUpdate.toString()}`);
      });
    },
    [router, params],
  );

  const currentPlatform = params.get("platform") || "all";
  const options = useMemo(
    () => mapStringToCollection(platformOptions),
    [platformOptions],
  );

  return (
    <SelectRoot
      collection={options}
      disabled={pending}
      value={[currentPlatform]}
      onValueChange={(e) => onPlatformSelect(e.value)}
      flexShrink={0}
      maxW="400px"
    >
      <SelectTrigger>
        <SelectValueText placeholder="Select platform" />
      </SelectTrigger>
      <SelectContent>
        {options.items.map((option) => (
          <SelectItem item={option} key={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}
