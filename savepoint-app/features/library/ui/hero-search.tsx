"use client";

import { Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Input } from "@/shared/components/ui/input";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { cn } from "@/shared/lib/ui/utils";

import { useOptimisticFilters } from "../hooks/use-optimistic-filters";

const subscribeNoop = () => () => {};

const isEditableElement = (element: Element | null): boolean => {
  if (!element) return false;
  const tagName = element.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }
  if (element instanceof HTMLElement && element.isContentEditable) {
    return true;
  }
  return false;
};

export function HeroSearch() {
  const { filters, isPending, pendingField, setSearch } =
    useOptimisticFilters();
  const initialValue = filters.search ?? "";
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebouncedValue(value, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  useEffect(() => {
    const currentSearch = filters.search ?? "";
    if (debouncedValue === currentSearch) return;
    setSearch(debouncedValue || null);
  }, [debouncedValue, filters.search, setSearch]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableElement(document.activeElement)) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const shortcutLabel = "/";
  const isSearchPending = isPending && pendingField === "search";

  return (
    <div className="mb-md relative w-full">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Filter library..."
        aria-label="Filter library by title"
        className={cn(
          "h-11 rounded-md pr-20 pl-10 text-base",
          "focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:ring-offset-0"
        )}
      />
      {mounted && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5"
        >
          {isSearchPending && (
            <Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
          )}
          <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[11px]">
            {shortcutLabel}
          </span>
        </span>
      )}
    </div>
  );
}
