"use client";

import { LayoutList, Loader2 } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { LIBRARY_STATUS_CONFIG } from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";

import { useOptimisticFilters } from "../hooks/use-optimistic-filters";
import { useStatusCounts } from "../hooks/use-status-counts";

const SESSION_KEY = "library-rail-expanded";

const subscribeNoop = () => () => {};

function subscribeToRailExpanded(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getRailExpandedClient(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) !== "false";
  } catch {
    return true;
  }
}

function getRailExpandedServer(): boolean {
  return true;
}

function setRailExpanded(value: boolean): void {
  try {
    sessionStorage.setItem(SESSION_KEY, value ? "true" : "false");
    window.dispatchEvent(new Event("storage"));
  } catch {
    // sessionStorage unavailable — ignore
  }
}

export function LibraryFilterSidebarRail() {
  const { filters, isPending, pendingField, setStatus } =
    useOptimisticFilters();

  const currentStatus = filters.status ?? "__all__";

  const { data: counts } = useStatusCounts({
    platform: filters.platform,
    search: filters.search,
  });

  const expanded = useSyncExternalStore(
    subscribeToRailExpanded,
    getRailExpandedClient,
    getRailExpandedServer
  );

  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  const toggleExpanded = useCallback(() => {
    setRailExpanded(!expanded);
  }, [expanded]);

  if (!mounted) return null;

  const isStatusPending = isPending && pendingField === "status";

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          "hidden shrink-0 flex-col gap-1 pt-1 transition-all md:flex xl:hidden",
          expanded ? "w-44" : "w-10"
        )}
        aria-label="Library status filter rail"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              aria-label={
                expanded ? "Collapse filter rail" : "Expand filter rail"
              }
              className="h-9 w-9 shrink-0 p-0"
            >
              <LayoutList className="h-4 w-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {expanded ? "Collapse" : "Expand filters"}
          </TooltipContent>
        </Tooltip>

        <Button
          variant={currentStatus === "__all__" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setStatus(null)}
          aria-label="Show all statuses"
          aria-pressed={currentStatus === "__all__"}
          disabled={isStatusPending}
          className={cn(
            "h-9 shrink-0 justify-start gap-2",
            expanded ? "w-full px-3" : "w-9 p-0"
          )}
        >
          <span className="text-muted-foreground text-xs font-bold">All</span>
          {expanded && (
            <span className="text-muted-foreground ml-auto text-xs tabular-nums">
              {counts
                ? Object.values(counts).reduce((sum, n) => sum + n, 0)
                : 0}
            </span>
          )}
        </Button>

        {LIBRARY_STATUS_CONFIG.map((config) => {
          const isActive = currentStatus === config.value;
          const count = counts?.[config.value] ?? 0;
          const Icon = config.icon;

          return (
            <Tooltip key={config.value}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatus(config.value)}
                  aria-label={`Filter by ${config.label}${count > 0 ? ` (${count})` : ""}`}
                  aria-pressed={isActive}
                  disabled={isStatusPending}
                  className={cn(
                    "h-9 shrink-0 justify-start gap-2 transition-all",
                    count === 0 && "opacity-50",
                    expanded ? "w-full px-3" : "w-9 p-0"
                  )}
                >
                  {isStatusPending && isActive ? (
                    <Loader2
                      className="h-4 w-4 shrink-0 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  {expanded && (
                    <>
                      <span className="text-sm">{config.label}</span>
                      <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                        {count}
                      </span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              {!expanded && (
                <TooltipContent side="right">
                  {config.label} ({count})
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </aside>
    </TooltipProvider>
  );
}
