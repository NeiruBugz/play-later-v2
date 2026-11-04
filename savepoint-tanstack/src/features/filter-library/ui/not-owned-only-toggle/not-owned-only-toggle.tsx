import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";

import type { NotOwnedOnlyToggleProps } from "./not-owned-only-toggle.type";

export function NotOwnedOnlyToggle({
  status,
  checked,
  onChange,
  id,
}: NotOwnedOnlyToggleProps) {
  if (status !== "WANT") return null;

  return (
    <div className="gap-sm flex items-center">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-sm font-medium">
        Not owned only
      </Label>
    </div>
  );
}
