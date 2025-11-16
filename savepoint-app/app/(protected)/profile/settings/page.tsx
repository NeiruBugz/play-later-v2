import { isSuccessResult, ProfileService } from "@/data-access-layer/services";
import { redirect } from "next/navigation";

import { ProfileSettingsForm } from "@/features/profile/ui/profile-settings-form";
import { BrowserBackButton } from "@/shared/components/browser-back-button";
import { requireServerUserId } from "@/shared/lib/app/auth";

export default async function ProfileSettingsPage() {
  const userId = await requireServerUserId();

  const profileService = new ProfileService();
  const result = await profileService.getProfile({ userId });

  if (!isSuccessResult(result)) {
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
