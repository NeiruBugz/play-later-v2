"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/lib";
import { LibraryStatusMapper } from "@/shared/lib/enum-mappers";

const statusOptions = [
  { value: "All", label: "All Games", shortLabel: "All", icon: "🎮" },
  {
    value: "CURIOUS_ABOUT",
    label: LibraryStatusMapper.CURIOUS_ABOUT,
    shortLabel: "Curious",
    icon: "📚",
  },
  {
    value: "CURRENTLY_EXPLORING",
    label: LibraryStatusMapper.CURRENTLY_EXPLORING,
    shortLabel: "Exploring",
    icon: "🎯",
  },
  {
    value: "TOOK_A_BREAK",
    label: LibraryStatusMapper.TOOK_A_BREAK,
    shortLabel: "Break",
    icon: "⏸️",
  },
  {
    value: "EXPERIENCED",
    label: LibraryStatusMapper.EXPERIENCED,
    shortLabel: "Done",
    icon: "✅",
  },
  {
    value: "WISHLIST",
    label: LibraryStatusMapper.WISHLIST,
    shortLabel: "Wishlist",
    icon: "⭐",
  },
  {
    value: "REVISITING",
    label: LibraryStatusMapper.REVISITING,
    shortLabel: "Revisit",
    icon: "🔄",
  },
] as const;

export function StatusFilter() {
  const params = useSearchParams();
  const router = useRouter();

  const currentStatusParam = params.get("status");
  const currentValue = currentStatusParam ?? "All";

  const onStatusSelect = useCallback(
    (value: string | null) => {
      if (!value) {
        return;
      }

      const paramsToUpdate = new URLSearchParams(params);

      if (value === "All") {
        paramsToUpdate.delete("status");
      } else {
        paramsToUpdate.set("status", value);
      }
      paramsToUpdate.set("page", "1");

      router.replace(`/collection/?${paramsToUpdate.toString()}`);
    },
    [router, params]
  );

  const currentOption = statusOptions.find(
    (option) => option.value === currentValue
  );

  return (
    <>
      {/* Mobile: Dropdown Select - Better UX on touch devices */}
      <div className="block md:hidden">
        <Select value={currentValue} onValueChange={onStatusSelect}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span className="text-sm">{currentOption?.icon}</span>
                <span className="font-medium">{currentOption?.label}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-3 py-1">
                  <span className="text-sm">{option.icon}</span>
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Pill Buttons - Optimized for mouse interaction */}
      <div className="hidden items-center gap-2 md:flex">
        {statusOptions.map((option) => {
          const isActive = currentValue === option.value;
          return (
            <Button
              key={option.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onStatusSelect(option.value);
              }}
              className={cn(
                "h-9 px-4 text-sm font-medium transition-all duration-200",
                "hover:scale-105 active:scale-95",
                isActive && "shadow-md"
              )}
            >
              <span className="mr-2">{option.icon}</span>
              <span className="hidden lg:inline">{option.label}</span>
              <span className="lg:hidden">{option.shortLabel}</span>
            </Button>
          );
        })}
      </div>
    </>
  );
}
