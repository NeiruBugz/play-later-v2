"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type SortOption = {
  value: string;
  label: string;
  sortBy: "createdAt" | "releaseDate" | "startedAt" | "completedAt";
  sortOrder: "asc" | "desc";
};

const SORT_OPTIONS: SortOption[] = [
  {
    value: "createdAt-desc",
    label: "Recently Added",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  {
    value: "createdAt-asc",
    label: "Oldest First",
    sortBy: "createdAt",
    sortOrder: "asc",
  },
  {
    value: "releaseDate-desc",
    label: "Release Date (Newest)",
    sortBy: "releaseDate",
    sortOrder: "desc",
  },
  {
    value: "releaseDate-asc",
    label: "Release Date (Oldest)",
    sortBy: "releaseDate",
    sortOrder: "asc",
  },
  {
    value: "startedAt-desc",
    label: "Started (Most Recent)",
    sortBy: "startedAt",
    sortOrder: "desc",
  },
  {
    value: "startedAt-asc",
    label: "Started (Oldest)",
    sortBy: "startedAt",
    sortOrder: "asc",
  },
  {
    value: "completedAt-desc",
    label: "Completed (Most Recent)",
    sortBy: "completedAt",
    sortOrder: "desc",
  },
  {
    value: "completedAt-asc",
    label: "Completed (Oldest)",
    sortBy: "completedAt",
    sortOrder: "asc",
  },
];

export function LibrarySortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getCurrentSortValue = useCallback((): string => {
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";
    return `${sortBy}-${sortOrder}`;
  }, [searchParams]);

  const handleSortChange = useCallback(
    (value: string) => {
      const selectedOption = SORT_OPTIONS.find((opt) => opt.value === value);
      if (!selectedOption) {
        return;
      }
      const params = new URLSearchParams(searchParams.toString());

      params.set("sortBy", selectedOption.sortBy);
      params.set("sortOrder", selectedOption.sortOrder);
      router.push(`/library?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );
  return (
    <div className="gap-lg flex items-center">
      <Label htmlFor="sort-select" className="body-sm text-muted-foreground">
        Sort by
      </Label>
      <Select value={getCurrentSortValue()} onValueChange={handleSortChange}>
        <SelectTrigger id="sort-select" className="w-[200px]">
          <SelectValue placeholder="Recently Added" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
