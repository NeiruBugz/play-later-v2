"use client";

import { useActionState, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { initialFormState } from "../lib/constants";
import { updateProfileFormAction } from "../server-actions/update-profile";
import { AvatarUpload } from "./avatar-upload";
import type { ProfileSettingsFormProps } from "./profile-settings-form.types";
import { UsernameInput } from "./username-input";

export function ProfileSettingsForm({
  currentUsername,
  currentAvatar,
}: ProfileSettingsFormProps) {
  const [username, setUsername] = useState(currentUsername ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    currentAvatar ?? null
  );
  const [hasValidationError, setHasValidationError] = useState(false);
  const [state, formAction, isPending] = useActionState(
    updateProfileFormAction,
    initialFormState
  );
  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Profile updated successfully!");
      setUsername((current) => state.submittedUsername ?? current.trim());
    }
  }, [state]);
  const handleAvatarUploadSuccess = (url: string) => {
    setAvatarUrl(url);
    toast.success("Profile image uploaded successfully.");
  };
  const handleAvatarUploadError = (error: string) => {
    toast.error(error, {
      description: "Please try again or choose a different image.",
    });
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (username.trim().length < 3 || username.trim().length > 25) {
      event.preventDefault();
    }
  };
  const trimmedUsername = username.trim();
  const showServerError =
    state.status === "error" &&
    !!state.message &&
    state.submittedUsername === trimmedUsername;
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your profile information. Changes will be visible to other
          users.
        </CardDescription>
      </CardHeader>
      <form action={formAction} onSubmit={handleSubmit} noValidate>
        <input
          type="hidden"
          name="avatarUrl"
          value={avatarUrl ?? ""}
          data-testid="avatar-url-input"
        />
        <input type="hidden" name="username" value={username} />
        <CardContent className="space-y-2xl">
          <div className="space-y-md">
            <label className="body-sm text-foreground font-medium">
              Profile Image
            </label>
            <AvatarUpload
              currentAvatar={avatarUrl}
              onUploadSuccess={handleAvatarUploadSuccess}
              onUploadError={handleAvatarUploadError}
            />
          </div>
          <div className="space-y-md">
            <label className="body-sm text-foreground font-medium">
              Username
            </label>
            <UsernameInput
              value={username}
              onChange={setUsername}
              error={showServerError ? state.message : undefined}
              disabled={isPending}
              onValidationChange={setHasValidationError}
            />
            <p className="body-sm text-muted-foreground">
              Must be 3-25 characters. Letters, numbers, and (_, -, .) allowed.
            </p>
          </div>
        </CardContent>
        <CardFooter className="gap-md flex flex-wrap justify-between">
          <Button
            type="submit"
            disabled={isPending || hasValidationError}
            className="w-full sm:w-auto"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
