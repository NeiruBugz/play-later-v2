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
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/ui";

import { initialFormState } from "../lib/constants";
import { ProfileSettingsFormProps } from "../lib/types";
import { updateProfileFormAction } from "../server-actions/update-profile";

export function ProfileSettingsForm({
  currentUsername,
  currentAvatar,
}: ProfileSettingsFormProps) {
  const [username, setUsername] = useState(currentUsername ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(
    updateProfileFormAction,
    initialFormState
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Profile updated successfully!");
      setValidationError(null);
      setUsername((current) => state.submittedUsername ?? current.trim());
    }
  }, [state]);

  const validateUsername = (value: string): string | null => {
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (trimmed.length > 25) {
      return "Username must not exceed 25 characters";
    }
    return null;
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setValidationError(validateUsername(value));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const validationErr = validateUsername(username);
    if (validationErr) {
      event.preventDefault();
      setValidationError(validationErr);
    } else {
      setValidationError(null);
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
        <input type="hidden" name="avatarUrl" value={currentAvatar ?? ""} />
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(event) => handleUsernameChange(event.target.value)}
              disabled={isPending}
              className={cn("", {
                "border-red-500": validationError,
              })}
              aria-invalid={!!validationError}
              aria-describedby={validationError ? "username-error" : undefined}
            />
            {validationError && (
              <p
                id="username-error"
                className="text-sm text-red-600"
                role="alert"
              >
                {validationError}
              </p>
            )}
            <p className="text-muted-foreground text-sm">
              Must be 3-25 characters. Letters, numbers, and (_, -, .) allowed.
            </p>
          </div>

          {showServerError && (
            <div
              className="rounded-md bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              {state.message}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="submit"
            disabled={isPending || !!validationError}
            className="w-full sm:w-auto"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
