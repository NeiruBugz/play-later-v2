"use client";
import type { Platform } from "@prisma/client";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import type {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shared/components/ui/command";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/ui/utils";
type PlatformComboboxProps<T extends FieldValues = FieldValues> = {
  field: ControllerRenderProps<T, FieldPath<T>>;
  supportedPlatforms: Platform[];
  otherPlatforms: Platform[];
  isLoading?: boolean;
  description?: string;
};
export const PlatformCombobox = <T extends FieldValues = FieldValues>({
  field,
  supportedPlatforms,
  otherPlatforms,
  isLoading = false,
  description = "Select the platform you own this game on",
}: PlatformComboboxProps<T>) => {
  const [open, setOpen] = useState(false);
  const allPlatforms = [...supportedPlatforms, ...otherPlatforms];
  const selectedPlatform = allPlatforms.find((p) => p.name === field.value);
  return (
    <FormItem className="flex flex-col">
      <FormLabel>Platform *</FormLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between",
                !field.value && "text-muted-foreground"
              )}
              disabled={isLoading}
            >
              {isLoading
                ? "Loading platforms..."
                : selectedPlatform
                  ? selectedPlatform.name
                  : "Select platform"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search platforms..." />
            <CommandList>
              <CommandEmpty>No platform found.</CommandEmpty>
              {supportedPlatforms.length > 0 && (
                <CommandGroup heading="Supported Platforms">
                  {supportedPlatforms.map((platform) => (
                    <CommandItem
                      key={platform.id}
                      value={platform.name}
                      onSelect={() => {
                        field.onChange(platform.name);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          field.value === platform.name
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {platform.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {supportedPlatforms.length > 0 && otherPlatforms.length > 0 && (
                <CommandSeparator />
              )}
              {otherPlatforms.length > 0 && (
                <CommandGroup heading="Other Platforms">
                  {otherPlatforms.map((platform) => (
                    <CommandItem
                      key={platform.id}
                      value={platform.name}
                      onSelect={() => {
                        field.onChange(platform.name);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          field.value === platform.name
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {platform.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
  );
};
