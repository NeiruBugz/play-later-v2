import { isSuccessResult, ProfileService } from "@/data-access-layer/services";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileSettingsForm } from "@/features/profile/ui/profile-settings-form";
import { BrowserBackButton } from "@/shared/components/browser-back-button";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const metadata: Metadata = {
  title: "Profile Settings",
  description: "Edit your SavePoint profile",
};

export default async function ProfileSettingsPage() {
  const userId = await requireServerUserId();
  const profileService = new ProfileService();
  const result = await profileService.getProfile({ userId });
  if (!isSuccessResult(result)) {
    redirect("/login");
  }
  return (
    <main className="py-3xl container mx-auto">
      <div className="gap-lg flex items-start">
        <BrowserBackButton />
        <ProfileSettingsForm
          currentUsername={result.data.profile.username}
          currentAvatar={result.data.profile.image}
        />
      </div>
    </main>
  );
}
