import { createFileRoute } from "@tanstack/react-router";

import { getProfileSettingsFn } from "@/features/edit-profile/api/get-profile-settings";
import { ProfileSettingsForm } from "@/features/edit-profile/ui/profile-settings-form";
import { AvatarUpload } from "@/features/upload-avatar";
import { SectionLabel } from "@/shared/ui/section-label";

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
        <SectionLabel id="profile-picture-heading" className="mb-3">
          Profile picture
        </SectionLabel>
        <AvatarUpload />
      </section>

      <ProfileSettingsForm profile={profile} />
    </div>
  );
}
