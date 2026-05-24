import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";

import type { StartedOnlyToggleProps } from "./started-only-toggle.type";

/**
 * F04 — turns `hasBeenPlayed` into a real filter axis. When ON, hides games
 * the user has never started, leaving only those played at least once
 * (regardless of current status) — one of the more useful backlog slices.
 */
export function StartedOnlyToggle({
  checked,
  onCheckedChange,
  id = "started-only",
}: StartedOnlyToggleProps) {
  return (
    <div className="gap-sm flex items-center">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label="Hide untouched games"
      />
      <Label htmlFor={id} className="text-sm font-medium">
        Hide untouched games
      </Label>
    </div>
  );
}
