import { useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { updateProfileFn, UsernameInput } from "@/features/edit-profile";
import { AvatarUpload } from "@/features/upload-avatar";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/shared/lib/constants";
import { getErrorMessage } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

import type { ProfileSetupFormProps } from "./profile-setup-form.type";

/**
 * First-run profile-setup form. Mirrors `savepoint-app`'s `ProfileSetupForm`
 * (`features/setup-profile/ui/profile-setup-form.tsx`): pre-fills the
 * suggested username, optionally lets the user set an avatar, and persists
 * the username on submit.
 *
 * Persistence reuses `edit-profile`'s `updateProfileFn` — there is no parallel
 * profile-write path. The avatar is uploaded independently by `AvatarUpload`
 * via its own server fn, exactly as on the settings page. On success the user
 * is sent to `/dashboard` (canonical's post-setup target).
 *
 * The canonical "Skip for now" affordance is intentionally omitted — it sets
 * `profileSetupCompletedAt`, a write tanstack's `updateProfile` does not yet
 * expose. Username-only setup is the critical path; skip is tracked as a
 * deferred parity item in DIVERGENCES.md.
 */
export function ProfileSetupForm({ defaultUsername }: ProfileSetupFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState(defaultUsername ?? "");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedUsername = username.trim();
  const isUsernameValid =
    trimmedUsername.length >= USERNAME_MIN_LENGTH &&
    trimmedUsername.length <= USERNAME_MAX_LENGTH;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isUsernameValid || isSubmitting) return;

    setServerError(null);
    setIsSubmitting(true);
    try {
      await updateProfileFn({ data: { username: trimmedUsername } });
      toast.success("Profile setup complete!");
      router.navigate({ to: "/dashboard" });
    } catch (err) {
      const message = getErrorMessage(err, "Setup failed");
      setServerError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>
          Set up your username and profile image to get started. You can always
          change these later in your profile settings.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-2xl">
          <div className="space-y-md">
            <p className="body-sm text-foreground font-medium">
              Profile Image (Optional)
            </p>
            <AvatarUpload />
          </div>
          <div className="space-y-md">
            <UsernameInput value={username} onChange={setUsername} />
            <p className="body-sm text-muted-foreground">
              Must be 3-25 characters. Letters, numbers, and (_, -, .) allowed.
            </p>
          </div>
          {serverError ? (
            <p role="alert" className="text-destructive text-sm">
              {serverError}
            </p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={isSubmitting || !isUsernameValid}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Saving..." : "Complete setup"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
