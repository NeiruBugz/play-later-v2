"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { updateProfile } from "@/features/profile/server-actions/update-profile";
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

type ProfileSettingsFormProps = {
  currentUsername: string | null;
  currentAvatar: string | null;
};

export function ProfileSettingsForm({
  currentUsername,
  currentAvatar,
}: ProfileSettingsFormProps) {
  const [username, setUsername] = useState(currentUsername ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateUsername = (value: string): string | null => {
    if (value.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (value.length > 25) {
      return "Username must not exceed 25 characters";
    }
    return null;
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setValidationError(validateUsername(value));
    setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    const validationErr = validateUsername(username);
    if (validationErr) {
      setValidationError(validationErr);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateProfile({
        username,
        avatarUrl: currentAvatar ?? undefined,
      });

      if (result.success) {
        toast.success("Profile updated successfully!");
        setError(null);
        setValidationError(null);
      } else {
        setError(result.error);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your profile information. Changes will be visible to other
          users.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              disabled={isSubmitting}
              className={validationError ? "border-red-500" : ""}
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

          {error && (
            <div
              className="rounded-md bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="submit"
            disabled={isSubmitting || !!validationError}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
