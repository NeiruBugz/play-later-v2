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
const SORT_LABELS: Record<
  NonNullable<ImportedGamesFilters["sortBy"]>,
  string
> = {
  added_desc: "Recently Added",
  name_asc: "Name (A-Z)",
  name_desc: "Name (Z-A)",
  playtime_desc: "Playtime (High to Low)",
  playtime_asc: "Playtime (Low to High)",
  last_played_desc: "Last Played (Recent)",
  last_played_asc: "Last Played (Oldest)",
};

type ChipDef = { key: string; label: string; onRemove: () => void };

export function ImportedGamesFilterBar({
  filters,
  includeIgnored,
}: ImportedGamesFilterBarProps) {
  const navigate = useNavigate({ from: "/steam/games" });

  // Local input state for the search box — committed on Enter / blur so we
  // don't navigate on every keystroke. Re-syncs when the URL changes (e.g.
  // chip-removal).
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
        // Strip falsy / "all" / undefined so they don't appear in the URL.
        for (const k of Object.keys(next)) {
          const v = next[k];
          if (v === undefined || v === "" || v === "all") delete next[k];
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
    update({ [key]: value === "all" ? undefined : (value as never) });
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

  // Selected values fall back to "all" so <Select> always has a value.
  const sel = {
    playtimeStatus: filters.playtimeStatus ?? "all",
    playtimeRange: filters.playtimeRange ?? "all",
    platform: filters.platform ?? "all",
    lastPlayed: filters.lastPlayed ?? "all",
    sortBy: filters.sortBy ?? "added_desc",
  };

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
  if (filters.playtimeStatus && filters.playtimeStatus !== "all") {
    const m: Record<string, string> = {
      played: "Played",
      never_played: "Never Played",
    };
    chips.push({
      key: "playtimeStatus",
      label: `Status: ${m[filters.playtimeStatus] ?? filters.playtimeStatus}`,
      onRemove: () => update({ playtimeStatus: undefined }),
    });
  }
  if (filters.playtimeRange && filters.playtimeRange !== "all") {
    const m: Record<string, string> = {
      under_1h: "Under 1h",
      "1_to_10h": "1-10h",
      "10_to_50h": "10-50h",
      over_50h: "50+h",
    };
    chips.push({
      key: "playtimeRange",
      label: `Playtime: ${m[filters.playtimeRange] ?? filters.playtimeRange}`,
      onRemove: () => update({ playtimeRange: undefined }),
    });
  }
  if (filters.platform && filters.platform !== "all") {
    const m: Record<string, string> = {
      windows: "Windows",
      mac: "Mac",
      linux: "Linux",
    };
    chips.push({
      key: "platform",
      label: `Platform: ${m[filters.platform] ?? filters.platform}`,
      onRemove: () => update({ platform: undefined }),
    });
  }
  if (filters.lastPlayed && filters.lastPlayed !== "all") {
    const m: Record<string, string> = {
      "30_days": "Last 30 days",
      "1_year": "Last year",
      over_1_year: "Over a year ago",
      never: "Never",
    };
    chips.push({
      key: "lastPlayed",
      label: `Last played: ${m[filters.lastPlayed] ?? filters.lastPlayed}`,
      onRemove: () => update({ lastPlayed: undefined }),
    });
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
      {/* Search */}
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

      {/* Sort */}
      <div className="space-y-1">
        <Label
          htmlFor="sort-selector"
          className="text-muted-foreground text-xs"
        >
          Sort by
        </Label>
        <Select
          value={sel.sortBy}
          onValueChange={(value) =>
            update({
              sortBy:
                value === "added_desc"
                  ? undefined
                  : (value as ImportedGamesFilters["sortBy"]),
            })
          }
        >
          <SelectTrigger id="sort-selector" aria-label="Sort games">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as Array<keyof typeof SORT_LABELS>).map(
              (key) => (
                <SelectItem key={key} value={key}>
                  {SORT_LABELS[key]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Show dismissed toggle */}
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

      {/* Filter grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="space-y-1">
          <Label
            htmlFor="playtime-status-filter"
            className="text-muted-foreground text-xs"
          >
            Playtime Status
          </Label>
          <Select
            value={sel.playtimeStatus}
            onValueChange={(v) => setEnum("playtimeStatus", v)}
          >
            <SelectTrigger
              id="playtime-status-filter"
              aria-label="Filter by playtime status"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="played">Played</SelectItem>
              <SelectItem value="never_played">Never Played</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="playtime-range-filter"
            className="text-muted-foreground text-xs"
          >
            Playtime Range
          </Label>
          <Select
            value={sel.playtimeRange}
            onValueChange={(v) => setEnum("playtimeRange", v)}
          >
            <SelectTrigger
              id="playtime-range-filter"
              aria-label="Filter by playtime range"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="under_1h">Under 1 hour</SelectItem>
              <SelectItem value="1_to_10h">1-10 hours</SelectItem>
              <SelectItem value="10_to_50h">10-50 hours</SelectItem>
              <SelectItem value="over_50h">50+ hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="platform-filter"
            className="text-muted-foreground text-xs"
          >
            Platform
          </Label>
          <Select
            value={sel.platform}
            onValueChange={(v) => setEnum("platform", v)}
          >
            <SelectTrigger id="platform-filter" aria-label="Filter by platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="windows">Windows</SelectItem>
              <SelectItem value="mac">Mac</SelectItem>
              <SelectItem value="linux">Linux</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="last-played-filter"
            className="text-muted-foreground text-xs"
          >
            Last Played
          </Label>
          <Select
            value={sel.lastPlayed}
            onValueChange={(v) => setEnum("lastPlayed", v)}
          >
            <SelectTrigger
              id="last-played-filter"
              aria-label="Filter by last played date"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="30_days">Last 30 days</SelectItem>
              <SelectItem value="1_year">Last year</SelectItem>
              <SelectItem value="over_1_year">Over a year ago</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active chips */}
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
