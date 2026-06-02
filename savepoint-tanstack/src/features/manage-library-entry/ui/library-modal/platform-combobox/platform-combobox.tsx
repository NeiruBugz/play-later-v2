import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { createLogger } from "@/shared/lib/logger";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import type { PlatformComboboxProps } from "./platform-combobox.type";
import {
  computeVisibleItems,
  NO_PLATFORM_LABEL,
  REMOTE_SEARCH_MIN_LENGTH,
  REMOTE_SEARCH_RESULTS_LABEL,
} from "./platform-combobox.utility";

const log = createLogger({ service: "platform-combobox" });

export function PlatformCombobox({
  value,
  groups,
  onChange,
  searchRemote,
}: PlatformComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<string[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);

  const select = (next: string) => {
    onChange(next);
    setQuery("");
    setOpen(false);
  };

  const trimmedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(trimmedQuery, 300);
  const remoteEnabled =
    searchRemote !== undefined &&
    open &&
    debouncedQuery.length >= REMOTE_SEARCH_MIN_LENGTH;

  // Guards against stale responses: only the latest issued query is allowed to
  // commit its results. A response that resolves after the query changed is
  // ignored.
  const latestQueryRef = useRef("");

  useEffect(() => {
    if (!searchRemote || !open) {
      setRemoteResults([]);
      setRemoteLoading(false);
      return;
    }
    if (debouncedQuery.length < REMOTE_SEARCH_MIN_LENGTH) {
      setRemoteResults([]);
      setRemoteLoading(false);
      return;
    }

    latestQueryRef.current = debouncedQuery;
    setRemoteLoading(true);

    searchRemote(debouncedQuery)
      .then((names) => {
        if (latestQueryRef.current !== debouncedQuery) return;
        setRemoteResults(names);
        setRemoteLoading(false);
      })
      .catch((error: unknown) => {
        log.error(
          { err: error, query: debouncedQuery },
          "remote platform search failed"
        );
        if (latestQueryRef.current !== debouncedQuery) return;
        setRemoteResults([]);
        setRemoteLoading(false);
      });
  }, [searchRemote, open, debouncedQuery]);

  // `shouldFilter={false}`: cmdk would otherwise hide items whose text does not
  // match the query, which would also hide the "Add" affordance for an
  // arbitrary platform (e.g. "Steam Deck") that appears in no group. We own the
  // filtering (in computeVisibleItems) so the create item is always reachable.
  const {
    visibleGroups,
    remoteOnlyResults,
    showRemoteSearching,
    showRemoteGroup,
    showCreate,
    showNoPlatform,
    hasAnyItem,
  } = computeVisibleItems({
    groups,
    value,
    trimmedQuery,
    remoteResults,
    remoteEnabled,
    remoteLoading,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label="Platform"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn(value === "" && "text-muted-foreground")}>
            {value === "" ? NO_PLATFORM_LABEL : value}
          </span>
          <ChevronsUpDown aria-hidden="true" className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or add a platform…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {showNoPlatform ? (
              <CommandItem value="__no_platform__" onSelect={() => select("")}>
                <Check
                  aria-hidden="true"
                  className={cn(value === "" ? "opacity-100" : "opacity-0")}
                />
                {NO_PLATFORM_LABEL}
              </CommandItem>
            ) : null}

            {visibleGroups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.platforms.map((platform) => (
                  <CommandItem
                    key={platform}
                    value={platform}
                    onSelect={() => select(platform)}
                  >
                    <Check
                      aria-hidden="true"
                      className={cn(
                        value === platform ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {platform}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            {showRemoteGroup ? (
              <CommandGroup heading={REMOTE_SEARCH_RESULTS_LABEL}>
                {showRemoteSearching ? (
                  <CommandItem value="__searching__" disabled>
                    Searching…
                  </CommandItem>
                ) : (
                  remoteOnlyResults.map((name) => (
                    <CommandItem
                      key={name}
                      value={`__remote__${name}`}
                      onSelect={() => select(name)}
                    >
                      <Check
                        aria-hidden="true"
                        className={cn(
                          value === name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {name}
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            ) : null}

            {showCreate ? (
              <CommandGroup>
                <CommandItem
                  value={`__create__${trimmedQuery}`}
                  onSelect={() => select(trimmedQuery)}
                >
                  {`Add "${trimmedQuery}"`}
                </CommandItem>
              </CommandGroup>
            ) : null}

            {hasAnyItem ? null : (
              <CommandEmpty>No platform found.</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
