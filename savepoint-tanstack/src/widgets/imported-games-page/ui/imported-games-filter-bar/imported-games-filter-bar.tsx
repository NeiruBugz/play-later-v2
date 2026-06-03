import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import type {
  ImportedGamesFilterBarProps,
  ImportedGamesFilters,
} from "./imported-games-filter-bar.type";

/**
 * URL-driven filter / sort / search controls for the imported-games surface.
 *
 * State lives in the URL via `validateSearch` on the route — deep links and
 * browser back/forward stay coherent. The bar reads its current values from
 * props (route loader passes them in) and mutates via `useNavigate({ to: "." })`
 * preserving the rest of the search-param shape.
 *
 * Sentinel `"all"` is the canonical "no filter" value — chosen because
 * `<Select>` requires a non-empty string value. When the user picks "all" we
 * delete the param from the URL so it doesn't show up.
 */
/**
 * Single source of truth for every filter/sort `<Select>` on this bar.
 *
 * Both the rendered `<SelectItem>`s AND the active-filter chips are derived
 * from this config so a label change is a one-place edit.
 *
 * Per option:
 * - `label` is the text shown inside the `<Select>`.
 * - `chipLabel` (optional) is the text shown on the active-filter chip when it
 *   intentionally differs from the Select label (e.g. abbreviated playtime
 *   ranges). When omitted the chip reuses `label`.
 *
 * Per field:
 * - `sentinel` is the value that means "no filter" (`"all"`) or, for sort, the
 *   implicit default (`"added_desc"`). Picking the sentinel deletes the param.
 * - `chipPrefix` is the leading text on the chip (`"Status: "`); sort has no
 *   chip, so it omits the prefix.
 */
const ALL = "all" as const;
const SORT_DEFAULT = "added_desc" as const;

type FilterOption = { value: string; label: string; chipLabel?: string };

type FilterFieldConfig = {
  paramKey: "playtimeStatus" | "playtimeRange" | "platform" | "lastPlayed";
  fieldLabel: string;
  triggerId: string;
  triggerAriaLabel: string;
  chipPrefix: string;
  options: readonly FilterOption[];
};

const FILTER_FIELDS: readonly FilterFieldConfig[] = [
  {
    paramKey: "playtimeStatus",
    fieldLabel: "Playtime Status",
    triggerId: "playtime-status-filter",
    triggerAriaLabel: "Filter by playtime status",
    chipPrefix: "Status: ",
    options: [
      { value: ALL, label: "All" },
      { value: "played", label: "Played" },
      { value: "never_played", label: "Never Played" },
    ],
  },
  {
    paramKey: "playtimeRange",
    fieldLabel: "Playtime Range",
    triggerId: "playtime-range-filter",
    triggerAriaLabel: "Filter by playtime range",
    chipPrefix: "Playtime: ",
    options: [
      { value: ALL, label: "All" },
      { value: "under_1h", label: "Under 1 hour", chipLabel: "Under 1h" },
      { value: "1_to_10h", label: "1-10 hours", chipLabel: "1-10h" },
      { value: "10_to_50h", label: "10-50 hours", chipLabel: "10-50h" },
      { value: "over_50h", label: "50+ hours", chipLabel: "50+h" },
    ],
  },
  {
    paramKey: "platform",
    fieldLabel: "Platform",
    triggerId: "platform-filter",
    triggerAriaLabel: "Filter by platform",
    chipPrefix: "Platform: ",
    options: [
      { value: ALL, label: "All Platforms" },
      { value: "windows", label: "Windows" },
      { value: "mac", label: "Mac" },
      { value: "linux", label: "Linux" },
    ],
  },
  {
    paramKey: "lastPlayed",
    fieldLabel: "Last Played",
    triggerId: "last-played-filter",
    triggerAriaLabel: "Filter by last played date",
    chipPrefix: "Last played: ",
    options: [
      { value: ALL, label: "All Time" },
      { value: "30_days", label: "Last 30 days" },
      { value: "1_year", label: "Last year" },
      { value: "over_1_year", label: "Over a year ago" },
      { value: "never", label: "Never" },
    ],
  },
];

const SORT_OPTIONS: readonly FilterOption[] = [
  { value: SORT_DEFAULT, label: "Recently Added" },
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
  { value: "playtime_desc", label: "Playtime (High to Low)" },
  { value: "playtime_asc", label: "Playtime (Low to High)" },
  { value: "last_played_desc", label: "Last Played (Recent)" },
  { value: "last_played_asc", label: "Last Played (Oldest)" },
];

const chipLabelFor = (field: FilterFieldConfig, value: string) => {
  const option = field.options.find((o) => o.value === value);
  const text = option?.chipLabel ?? option?.label ?? value;
  return `${field.chipPrefix}${text}`;
};

type ChipDef = { key: string; label: string; onRemove: () => void };

export function ImportedGamesFilterBar({
  filters,
  includeIgnored,
}: ImportedGamesFilterBarProps) {
  const navigate = useNavigate({ from: "/steam/games" });

  // Committed on Enter / blur so we don't navigate on every keystroke;
  // re-synced when the URL changes (e.g. chip-removal).
  const [searchValue, setSearchValue] = useState(filters.q ?? "");
  useEffect(() => {
    setSearchValue(filters.q ?? "");
  }, [filters.q]);

  const update = (
    patch: Partial<{
      q: string | undefined;
      include: "ignored" | undefined;
      playtimeStatus: ImportedGamesFilters["playtimeStatus"];
      playtimeRange: ImportedGamesFilters["playtimeRange"];
      platform: ImportedGamesFilters["platform"];
      lastPlayed: ImportedGamesFilters["lastPlayed"];
      sortBy: ImportedGamesFilters["sortBy"];
    }>
  ) => {
    void navigate({
      to: ".",
      search: (prev) => {
        const next: Record<string, unknown> = { ...prev, ...patch };
        for (const k of Object.keys(next)) {
          const v = next[k];
          if (v === undefined || v === "" || v === ALL) delete next[k];
        }
        return next;
      },
    });
  };

  const setEnum = <
    K extends "playtimeStatus" | "playtimeRange" | "platform" | "lastPlayed",
  >(
    key: K,
    value: string
  ) => {
    update({ [key]: value === ALL ? undefined : (value as never) });
  };

  const commitSearch = () => {
    const trimmed = searchValue.trim();
    if ((filters.q ?? "") === trimmed) return;
    update({ q: trimmed === "" ? undefined : trimmed });
  };

  const clearSearch = () => {
    setSearchValue("");
    update({ q: undefined });
  };

  const selectedValueFor = (key: FilterFieldConfig["paramKey"]) =>
    filters[key] ?? ALL;

  const chips: ChipDef[] = [];
  if (filters.q && filters.q.trim().length > 0) {
    chips.push({
      key: "q",
      label: `Search: ${filters.q}`,
      onRemove: () => {
        setSearchValue("");
        update({ q: undefined });
      },
    });
  }
  for (const field of FILTER_FIELDS) {
    const value = filters[field.paramKey];
    if (value && value !== ALL) {
      chips.push({
        key: field.paramKey,
        label: chipLabelFor(field, value),
        onRemove: () => update({ [field.paramKey]: undefined }),
      });
    }
  }
  if (includeIgnored) {
    chips.push({
      key: "include",
      label: "Showing dismissed",
      onRemove: () => update({ include: undefined }),
    });
  }

  const clearAll = () => {
    setSearchValue("");
    void navigate({
      to: ".",
      search: () => ({}),
    });
  };

  return (
    <div className="space-y-4" data-testid="imported-games-filter-bar">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="Search games..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onBlur={commitSearch}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitSearch();
            }
          }}
          className="pr-9 pl-9"
          aria-label="Search imported games"
        />
        {searchValue ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className="space-y-1">
        <Label
          htmlFor="sort-selector"
          className="text-muted-foreground text-xs"
        >
          Sort by
        </Label>
        <Select
          value={filters.sortBy ?? SORT_DEFAULT}
          onValueChange={(value) =>
            update({
              sortBy:
                value === SORT_DEFAULT
                  ? undefined
                  : (value as ImportedGamesFilters["sortBy"]),
            })
          }
        >
          <SelectTrigger id="sort-selector" aria-label="Sort games">
            <SelectValue />
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

      <div className="flex items-center space-x-2">
        <Checkbox
          id="show-dismissed"
          checked={includeIgnored}
          onCheckedChange={(checked) =>
            update({ include: checked === true ? "ignored" : undefined })
          }
        />
        <Label
          htmlFor="show-dismissed"
          className="text-muted-foreground cursor-pointer text-sm font-normal"
        >
          Show dismissed games
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {FILTER_FIELDS.map((field) => (
          <div key={field.paramKey} className="space-y-1">
            <Label
              htmlFor={field.triggerId}
              className="text-muted-foreground text-xs"
            >
              {field.fieldLabel}
            </Label>
            <Select
              value={selectedValueFor(field.paramKey)}
              onValueChange={(v) => setEnum(field.paramKey, v)}
            >
              <SelectTrigger
                id={field.triggerId}
                aria-label={field.triggerAriaLabel}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {chips.length > 0 ? (
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label="Active filters"
        >
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              aria-label={`Remove ${chip.label} filter`}
              className="border-input bg-muted hover:bg-muted/80 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
            >
              <span>{chip.label}</span>
              <X className="h-3 w-3" />
            </button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            aria-label="Clear all filters"
          >
            Clear all
          </Button>
        </div>
      ) : null}
    </div>
  );
}
