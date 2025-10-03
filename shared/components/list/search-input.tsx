"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";

type ListSearchInputProps = {
  paramKey?: string;
  placeholder?: string;
};

export function ListSearchInput({
  paramKey = "search",
  placeholder = "Search...",
}: ListSearchInputProps) {
  const router = useRouter();
  const params = useSearchParams();
  const value = params.get(paramKey) ?? "";

  const update = useCallback(
    (next: string) => {
      const sp = new URLSearchParams(params?.toString());
      if (next) {
        sp.set(paramKey, next);
      } else {
        sp.delete(paramKey);
      }
      // reset to first page on search change
      sp.delete("page");
      router.replace(`?${sp.toString()}`);
    },
    [paramKey, params, router]
  );

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        defaultValue={value}
        onChange={(e) => update(e.target.value)}
        className="pl-10"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => update("")}
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2 p-0"
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}

