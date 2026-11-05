import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";

import type { ProfileVisibilityToggleProps } from "./profile-visibility-toggle.type";

export function ProfileVisibilityToggle({
  checked,
  onCheckedChange,
  id = "public-profile-toggle",
  disabled = false,
}: ProfileVisibilityToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm">
          Public profile
        </Label>
        <p className="text-sm text-muted-foreground">
          Allow other users to see your profile and gaming activity
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
