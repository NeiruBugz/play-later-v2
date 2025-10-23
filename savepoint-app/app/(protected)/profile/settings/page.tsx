import { getServerUserId } from "@/auth";
import { ProfileService } from "@/data-access-layer/services";
import { redirect } from "next/navigation";

import { ProfileSettingsForm } from "@/features/profile/ui/profile-settings-form";
import { BrowserBackButton } from "@/shared/components/browser-back-button";

export default async function ProfileSettingsPage() {
  const userId = await getServerUserId();

  if (!userId) {
    redirect("/login");
  }

  const profileService = new ProfileService();
  const result = await profileService.getProfile({ userId });

  if (!result.success) {
    redirect("/login");
  }

  return (
    <div className="flex items-start gap-3">
      <BrowserBackButton />
      <ProfileSettingsForm
        currentUsername={result.data.profile.username}
        currentAvatar={result.data.profile.image}
      />
    </div>
  );
}
