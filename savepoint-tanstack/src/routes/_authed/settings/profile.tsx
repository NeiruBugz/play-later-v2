import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { getProfileSettingsFn } from "@/features/edit-profile/api/get-profile-settings";
import { ProfileSettingsForm } from "@/features/edit-profile/ui/profile-settings-form";
import { AvatarUpload } from "@/features/upload-avatar";

export const Route = createFileRoute("/_authed/settings/profile")({
  loader: () => getProfileSettingsFn(),
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  const { profile } = Route.useLoaderData();

  return (
    <main className="container mx-auto px-4 py-6">
      <Link
        to="/profile"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to profile
      </Link>

      <section className="mb-8" aria-labelledby="profile-picture-heading">
        <h2 id="profile-picture-heading" className="mb-3 text-base font-medium">
          Profile picture
        </h2>
        <AvatarUpload />
      </section>

      <ProfileSettingsForm profile={profile} />
    </main>
  );
}
