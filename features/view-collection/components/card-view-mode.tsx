"use client";

import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

export function CardViewMode() {
  const params = useSearchParams();
  const router = useRouter();

  const displayMode = params.get("cardMode") || "combined";

  const handleDisplayModeChange = useCallback(
    (value: string | null) => {
      if (!value) {
        return;
      }

      const paramsToUpdate = new URLSearchParams(params);

      paramsToUpdate.set("cardMode", value);
      paramsToUpdate.set("page", "1");

      router.replace(`/collection/?${paramsToUpdate.toString()}`);
    },
    [router, params]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-1">
          <span>View Mode</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Display Mode</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={displayMode === "combined"}
          onCheckedChange={() => handleDisplayModeChange("combined")}
        >
          Combined (Group by Game)
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={displayMode === "separate"}
          onCheckedChange={() => handleDisplayModeChange("separate")}
        >
          Separate (One Entry Per Platform)
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
