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
    <div className="gap-lg p-lg flex items-center justify-between rounded-lg border">
      <div className="space-y-xs">
        <Label htmlFor={id} className="body-sm font-medium">
          Public profile
        </Label>
        <p className="body-sm text-muted-foreground">
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
