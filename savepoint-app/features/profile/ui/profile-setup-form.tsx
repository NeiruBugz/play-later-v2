"use client";

import { useRouter } from "next/navigation";
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
import { completeProfileSetupFormAction } from "../server-actions/complete-profile-setup";
import { AvatarUpload } from "./avatar-upload";
import { UsernameInput } from "./username-input";

type ProfileSetupFormProps = {
  defaultUsername?: string;
};

export function ProfileSetupForm({ defaultUsername }: ProfileSetupFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState(defaultUsername ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasValidationError, setHasValidationError] = useState(false);
  const [state, formAction, isPending] = useActionState(
    completeProfileSetupFormAction,
    initialFormState
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Profile setup complete!");
      // Redirect to dashboard after successful setup
      router.push("/dashboard");
    }
  }, [state, router]);

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

  const handleSkip = () => {
    router.push("/dashboard");
  };

  const trimmedUsername = username.trim();
  const showServerError =
    state.status === "error" &&
    !!state.message &&
    state.submittedUsername === trimmedUsername;

  return (
    <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Set up your username and profile image to get started. You can
            always change these later in your profile settings.
          </CardDescription>
        </CardHeader>
        <form action={formAction} onSubmit={handleSubmit} noValidate>
          <input type="hidden" name="avatarUrl" value={avatarUrl ?? ""} />
          <input type="hidden" name="username" value={username} />
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">
                Profile Image (Optional)
              </label>
              <AvatarUpload
                currentAvatar={avatarUrl}
                onUploadSuccess={handleAvatarUploadSuccess}
                onUploadError={handleAvatarUploadError}
              />
            </div>

            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">
                Username <span className="text-destructive">*</span>
              </label>
              <UsernameInput
                value={username}
                onChange={setUsername}
                error={showServerError ? state.message : undefined}
                disabled={isPending}
                onValidationChange={setHasValidationError}
              />
              <p className="text-muted-foreground text-sm">
                Must be 3-25 characters. Letters, numbers, and (_, -, .)
                allowed.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              disabled={isPending || hasValidationError}
              className="w-full sm:w-auto"
            >
              {isPending ? "Saving..." : "Complete Setup"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
