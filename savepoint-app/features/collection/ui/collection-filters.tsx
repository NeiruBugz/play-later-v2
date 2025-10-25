"use client";

import { LibraryItemStatus } from "@prisma/client";
import { Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  createSelectOptionsFromEnum,
  LibraryStatusMapper,
} from "@/shared/lib/ui";
import type { FilterParams } from "@/shared/types/collection";

interface CollectionFiltersProps {
  filters: Omit<FilterParams, "page">;
  onApplyFilters: (filters: Omit<FilterParams, "page">) => void;
  onClearFilters: () => void;
  availablePlatforms: string[];
}

const statusOptions = createSelectOptionsFromEnum(
  LibraryItemStatus,
  LibraryStatusMapper
);

export function CollectionFilters({
  filters,
  onApplyFilters,
  onClearFilters,
  availablePlatforms,
}: CollectionFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const hasUnappliedChanges =
    localFilters.search !== filters.search ||
    localFilters.status !== filters.status ||
    localFilters.platform !== filters.platform;

  const hasActiveFilters = filters.search || filters.status || filters.platform;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters({ ...localFilters, search: e.target.value });
  };

  const handleStatusChange = (value: string) => {
    setLocalFilters({
      ...localFilters,
      status: value === "all" ? "" : value,
    });
  };

  const handlePlatformChange = (value: string) => {
    setLocalFilters({
      ...localFilters,
      platform: value === "all" ? "" : value,
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const handleClear = () => {
    setLocalFilters({ search: "", status: "", platform: "" });
    onClearFilters();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="text"
            placeholder="Search games..."
            value={localFilters.search}
            onChange={handleSearchChange}
            className="pl-9"
            aria-label="Search games by title"
          />
        </div>

        <Select
          value={localFilters.status || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger
            className="w-full sm:w-[200px]"
            aria-label="Filter by status"
          >
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={localFilters.platform || "all"}
          onValueChange={handlePlatformChange}
        >
          <SelectTrigger
            className="w-full sm:w-[200px]"
            aria-label="Filter by platform"
          >
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {availablePlatforms.map((platform) => (
              <SelectItem key={platform} value={platform}>
                {platform}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleApply}
          variant="default"
          disabled={!hasUnappliedChanges}
          aria-label="Apply selected filters"
        >
          Apply Filters
        </Button>

        {hasActiveFilters && (
          <Button
            onClick={handleClear}
            variant="outline"
            aria-label="Clear all active filters"
          >
            Clear All
          </Button>
        )}

        {hasUnappliedChanges && (
          <span className="text-muted-foreground text-sm">
            Filters not applied yet
          </span>
        )}
      </div>
    </div>
  );
}
