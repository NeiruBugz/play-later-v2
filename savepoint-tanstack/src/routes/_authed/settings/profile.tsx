import { createFileRoute } from "@tanstack/react-router";

import { getProfileSettingsFn } from "@/features/edit-profile/api/get-profile-settings";
import { ProfileSettingsForm } from "@/features/edit-profile/ui/profile-settings-form";
import { AvatarUpload } from "@/features/upload-avatar";

export const Route = createFileRoute("/_authed/settings/profile")({
  loader: () => getProfileSettingsFn(),
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  const { profile } = Route.useLoaderData();

  // Chrome (header, back-link, settings-nav rail) is owned by the parent
  // `_authed/settings.tsx` layout route. Child renders content only.
  return (
    <div>
      <section className="mb-8" aria-labelledby="profile-picture-heading">
        <h2 id="profile-picture-heading" className="mb-3 text-base font-medium">
          Profile picture
        </h2>
        <AvatarUpload />
      </section>

      <ProfileSettingsForm profile={profile} />
    </div>
  );
}
