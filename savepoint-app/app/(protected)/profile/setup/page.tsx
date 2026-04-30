import { ProfileService } from "@/data-access-layer/services";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileSetupForm } from "@/features/setup-profile";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const metadata: Metadata = {
  title: "Complete Your Profile - SavePoint",
  description: "Set up your username and profile image",
};

export default async function ProfileSetupPage() {
  const userId = await requireServerUserId();
  const profileService = new ProfileService();

  let setupStatus: Awaited<ReturnType<ProfileService["checkSetupStatus"]>>;
  try {
    setupStatus = await profileService.checkSetupStatus({ userId });
  } catch {
    redirect("/login");
  }

  if (!setupStatus.needsSetup) {
    redirect("/dashboard");
  }

  return (
    <div className="py-3xl container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center">
      <ProfileSetupForm defaultUsername={setupStatus.suggestedUsername} />
    </div>
  );
}
