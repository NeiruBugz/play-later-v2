import { ProfileService } from "@/data-access-layer/services";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileSetupForm } from "@/features/profile/ui/profile-setup-form";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const metadata: Metadata = {
  title: "Complete Your Profile - SavePoint",
  description: "Set up your username and profile image",
};

export default async function ProfileSetupPage() {
  const userId = await requireServerUserId();

  const profileService = new ProfileService();
  const result = await profileService.checkSetupStatus({ userId });

  if (!result.success) {
    redirect("/login");
  }

  // If setup already completed, redirect to dashboard
  if (!result.data.needsSetup) {
    redirect("/dashboard");
  }

  return <ProfileSetupForm defaultUsername={result.data.suggestedUsername} />;
}
