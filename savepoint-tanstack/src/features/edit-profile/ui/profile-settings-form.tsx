import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { Profile } from "@/entities/profile/model/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { updateProfileFn } from "../api/update-profile";
import { ProfileVisibilityToggle } from "./profile-visibility-toggle";
import { UsernameInput } from "./username-input";

const formSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3).max(25),
  isPublicProfile: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

type ProfileSettingsFormProps = {
  profile: Profile;
};

export function ProfileSettingsForm({ profile }: ProfileSettingsFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: profile.name ?? "",
      username: profile.username ?? "",
      isPublicProfile: profile.isPublicProfile ?? false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await updateProfileFn({ data: values });
      toast.success("Profile updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      setServerError(message);
      toast.error(message);
    }
  });

  const nameId = "profile-settings-name";
  const usernameId = "profile-settings-username";
  const visibilityId = "profile-settings-visibility";

  return (
    <form onSubmit={onSubmit} className="space-y-lg" noValidate>
      <div className="space-y-md">
        <Label htmlFor={nameId}>Display name</Label>
        <Input id={nameId} {...register("name")} />
      </div>

      <Controller
        control={control}
        name="username"
        render={({ field }) => (
          <UsernameInput
            id={usernameId}
            value={field.value}
            onChange={field.onChange}
            currentUsername={profile.username ?? undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="isPublicProfile"
        render={({ field }) => (
          <ProfileVisibilityToggle
            id={visibilityId}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />

      {serverError ? (
        <p role="alert" className="text-destructive text-sm">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        Save changes
      </Button>
    </form>
  );
}
