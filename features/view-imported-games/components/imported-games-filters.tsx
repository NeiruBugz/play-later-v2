"use client";

import { type Storefront } from "@prisma/client";
import { Filter, Search, X } from "lucide-react";
import { useState } from "react";

import { Body, Caption } from "@/shared/components/typography";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
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

type ImportedGamesFiltersProps = {
  filters: ImportedGamesFilters;
  onFiltersChange: (filters: ImportedGamesFilters) => void;
  totalGames: number;
  filteredGames: number;
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

export function ImportedGamesFilters({
  filters,
  onFiltersChange,
  totalGames,
  filteredGames,
}: ImportedGamesFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleStorefrontChange = (storefront: string) => {
    onFiltersChange({
      ...filters,
      storefront: storefront as Storefront | "ALL",
    });
  };

  const handleSortByChange = (sortBy: string) => {
    onFiltersChange({
      ...filters,
      sortBy: sortBy as ImportedGamesFilters["sortBy"],
    });
  };

  const handleSortOrderChange = (sortOrder: string) => {
    onFiltersChange({
      ...filters,
      sortOrder: sortOrder as ImportedGamesFilters["sortOrder"],
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

  const hasActiveFilters = filters.search || filters.storefront !== "ALL";
  const isFiltered = filteredGames !== totalGames;

  return (
    <div className="space-y-4">
      {/* Search and Results Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search imported games..."
            value={filters.search}
            onChange={(e) => {
              handleSearchChange(e.target.value);
            }}
            className="pl-10 pr-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handleSearchChange("");
              }}
              className="absolute right-1 top-1/2 size-7 -translate-y-1/2 p-0 hover:bg-transparent"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>

        {/* Results and Filter Toggle */}
        <div className="flex items-center gap-4">
          <Caption>
            {isFiltered ? (
              <>
                {filteredGames} of {totalGames} games
              </>
            ) : (
              <>{totalGames} games</>
            )}
          </Caption>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowFilters(!showFilters);
            }}
            className="gap-2"
          >
            <Filter className="size-4" />
            <Body size="sm">Filters</Body>
            {hasActiveFilters && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {
                  [
                    filters.search && "search",
                    filters.storefront !== "ALL" && "platform",
                  ].filter(Boolean).length
                }
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Platform Filter */}
            <div className="space-y-2">
              <Caption className="font-medium">Platform</Caption>
              <Select
                value={filters.storefront}
                onValueChange={handleStorefrontChange}
              >
                <SelectTrigger>
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

            {/* Sort By */}
            <div className="space-y-2">
              <Caption className="font-medium">Sort by</Caption>
              <Select value={filters.sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger>
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

            {/* Sort Order */}
            <div className="space-y-2">
              <Caption className="font-medium">Order</Caption>
              <Select
                value={filters.sortOrder}
                onValueChange={handleSortOrderChange}
              >
                <SelectTrigger>
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

            {/* Clear Filters */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full gap-2"
                >
                  <X className="size-4" />
                  <Body size="sm">Clear Filters</Body>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
