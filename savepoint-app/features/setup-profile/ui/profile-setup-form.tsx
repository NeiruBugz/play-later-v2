"use client";

import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react";
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
import { initialFormState } from "@/shared/lib/profile";

import {
  completeProfileSetupFormAction,
  skipProfileSetup,
} from "../server-actions";
import { AvatarUpload } from "./avatar-upload";
import type { ProfileSetupFormProps } from "./profile-setup-form.types";
import { UsernameInput } from "./username-input";

export function ProfileSetupForm({ defaultUsername }: ProfileSetupFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState(defaultUsername ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasValidationError, setHasValidationError] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, formAction, isActionPending] = useActionState(
    completeProfileSetupFormAction,
    initialFormState
  );
  const isFormPending = isPending || isActionPending;
  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Profile setup complete!");
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
  const handleAvatarUploadStateChange = (uploading: boolean) => {
    setIsAvatarUploading(uploading);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (username.trim().length < 3 || username.trim().length > 25) {
      event.preventDefault();
    }
  };
  const handleSkip = () => {
    startTransition(async () => {
      const res = await skipProfileSetup();
      if (!res.success) {
        toast.error(res.error ?? "Failed to complete setup");
        return;
      }
      router.push("/dashboard");
    });
  };
  const trimmedUsername = username.trim();
  const showServerError =
    state.status === "error" &&
    !!state.message &&
    state.submittedUsername === trimmedUsername;
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>
          Set up your username and profile image to get started. You can always
          change these later in your profile settings.
        </CardDescription>
      </CardHeader>
      <form action={formAction} onSubmit={handleSubmit} noValidate>
        <input type="hidden" name="avatarUrl" value={avatarUrl ?? ""} />
        <input type="hidden" name="username" value={username} />
        <CardContent className="space-y-2xl">
          <div className="space-y-md">
            <label className="body-sm text-foreground font-medium">
              Profile Image (Optional)
            </label>
            <AvatarUpload
              currentAvatar={avatarUrl}
              onUploadSuccess={handleAvatarUploadSuccess}
              onUploadError={handleAvatarUploadError}
              onUploadStateChange={handleAvatarUploadStateChange}
            />
          </div>
          <div className="space-y-md">
            <UsernameInput
              value={username}
              onChange={setUsername}
              error={showServerError ? state.message : undefined}
              disabled={isFormPending}
              onValidationChange={setHasValidationError}
            />
            <p className="body-sm text-muted-foreground">
              Must be 3-25 characters. Letters, numbers, and (_, -, .) allowed.
            </p>
          </div>
        </CardContent>
        <CardFooter className="gap-lg flex flex-col sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isFormPending || isAvatarUploading}
            className="w-full sm:w-auto"
          >
            Skip for now
          </Button>
          <Button
            type="submit"
            disabled={isFormPending || hasValidationError || isAvatarUploading}
            className="w-full sm:w-auto"
          >
            {isFormPending
              ? "Saving..."
              : isAvatarUploading
                ? "Uploading image..."
                : "Complete Setup"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
