"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";

import { updateProfile } from "../server-actions/update-profile";

type ProfileVisibilityToggleProps = {
  isPublicProfile: boolean;
  username: string;
};

export function ProfileVisibilityToggle({
  isPublicProfile,
  username,
}: ProfileVisibilityToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticIsPublic, setOptimisticIsPublic] =
    useOptimistic(isPublicProfile);

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      setOptimisticIsPublic(checked);

      const result = await updateProfile({
        username,
        isPublicProfile: checked,
      });

      if (!result.success) {
        toast.error("Failed to update profile visibility", {
          description: result.error,
        });
      }
    });
  }

  return (
    <div className="gap-lg p-lg flex items-center justify-between rounded-lg border">
      <div className="space-y-xs">
        <Label htmlFor="public-profile-toggle" className="body-sm font-medium">
          Public profile
        </Label>
        <p className="body-sm text-muted-foreground">
          {username
            ? "Allow other users to see your profile and gaming activity"
            : "Set a username first to enable public profile"}
        </p>
      </div>
      <Switch
        id="public-profile-toggle"
        checked={optimisticIsPublic}
        onCheckedChange={handleToggle}
        disabled={isPending || !username}
        aria-label="Toggle public profile visibility"
      />
    </div>
  );
}
