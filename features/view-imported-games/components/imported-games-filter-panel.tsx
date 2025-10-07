"use client";

import { type Storefront } from "@prisma/client";

import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export type ImportedGamesFilters = {
  search: string;
  storefront: Storefront | "ALL";
  sortBy: "name" | "playtime" | "storefront" | "createdAt";
  sortOrder: "asc" | "desc";
};

type Props = {
  filters: ImportedGamesFilters;
  onFiltersChange: (filters: ImportedGamesFilters) => void;
};

const storefrontOptions = [
  { value: "ALL", label: "All Platforms" },
  { value: "STEAM", label: "Steam" },
  { value: "PLAYSTATION", label: "PlayStation" },
  { value: "XBOX", label: "Xbox" },
] as const;

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "playtime", label: "Playtime" },
  { value: "storefront", label: "Platform" },
  { value: "createdAt", label: "Date Added" },
] as const;

const sortOrderOptions = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
] as const;

export function ImportedGamesFilterPanel({ filters, onFiltersChange }: Props) {
  const handleStorefrontChange = (storefront: string) => {
    onFiltersChange({
      ...filters,
      storefront: storefront as Storefront | "ALL",
    });
  };
  const handleSortByChange = (sortBy: string) => {
    onFiltersChange({
      ...filters,
      sortBy: sortBy as Props["filters"]["sortBy"],
    });
  };
  const handleSortOrderChange = (sortOrder: string) => {
    onFiltersChange({
      ...filters,
      sortOrder: sortOrder as Props["filters"]["sortOrder"],
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      storefront: "ALL",
      sortBy: "name",
      sortOrder: "asc",
    });
  };

  const hasActiveFilters = filters.storefront !== "ALL";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="space-y-2">
        <label className="text-sm font-medium">Platform</label>
        <Select
          value={filters.storefront}
          onValueChange={handleStorefrontChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {storefrontOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Sort by</label>
        <Select value={filters.sortBy} onValueChange={handleSortByChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Order</label>
        <Select value={filters.sortOrder} onValueChange={handleSortOrderChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOrderOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Clear
        </Button>
      )}
    </div>
  );
}
