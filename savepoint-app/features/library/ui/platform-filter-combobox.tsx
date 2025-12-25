"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/ui/utils";
import type { UniquePlatformResult } from "@/shared/types/platform";

type PlatformFilterComboboxProps = {
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
  platforms: UniquePlatformResult[] | undefined;
  isLoading: boolean;
  disabled?: boolean;
};

export function PlatformFilterCombobox({
  value,
  onValueChange,
  platforms,
  isLoading,
  disabled = false,
}: PlatformFilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const selectedPlatform = platforms?.find((p) => p.name === value);
  const displayValue =
    value === "__all__" || !value
      ? "All Platforms"
      : (selectedPlatform?.name ?? "All Platforms");

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === "__all__") {
      onValueChange(undefined);
    } else {
      onValueChange(selectedValue);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-9 w-full justify-between rounded-md border-input text-sm shadow-sm",
            (value === "__all__" || !value) && "text-muted-foreground"
          )}
          disabled={isLoading || disabled}
          aria-label="Filter by platform"
        >
          {isLoading ? "Loading..." : displayValue}
          <ChevronsUpDown className="ml-md h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search platforms..." />
          <ScrollArea className="h-[200px]">
            <CommandList className="max-h-none overflow-visible">
              <CommandEmpty>No platform found.</CommandEmpty>
              <CommandItem value="__all__" onSelect={handleSelect}>
                <Check
                  className={cn(
                    "mr-md h-4 w-4",
                    value === "__all__" || !value ? "opacity-100" : "opacity-0"
                  )}
                />
                All Platforms
              </CommandItem>
              {platforms?.map((platform) => (
                <CommandItem
                  key={platform.id}
                  value={platform.name}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-md h-4 w-4",
                      value === platform.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {platform.name}
                </CommandItem>
              ))}
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
