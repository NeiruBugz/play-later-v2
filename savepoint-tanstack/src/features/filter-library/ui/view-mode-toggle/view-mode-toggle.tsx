import { LayoutGrid, LayoutList } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import type { ViewMode, ViewModeToggleProps } from "./view-mode-toggle.type";

const OPTIONS: ReadonlyArray<{
  mode: ViewMode;
  label: string;
  Icon: typeof LayoutGrid;
}> = [
  { mode: "grid", label: "Grid view", Icon: LayoutGrid },
  { mode: "list", label: "List view", Icon: LayoutList },
];

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
  className,
}: ViewModeToggleProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {OPTIONS.map(({ mode, label, Icon }) => (
        <Button
          key={mode}
          variant="ghost"
          size="sm"
          aria-label={label}
          aria-pressed={viewMode === mode}
          onClick={() => onViewModeChange(mode)}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </Button>
      ))}
    </div>
  );
}
