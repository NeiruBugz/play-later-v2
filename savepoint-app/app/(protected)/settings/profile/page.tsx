import { isSuccessResult, ProfileService } from "@/data-access-layer/services";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ProfileSettingsForm,
  ProfileVisibilityToggle,
} from "@/features/profile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const metadata: Metadata = {
  title: "Profile Settings",
  description: "Edit your SavePoint profile",
};

export default async function SettingsProfilePage() {
  const userId = await requireServerUserId();
  const profileService = new ProfileService();
  const profileResult = await profileService.getProfile({ userId });

  if (!isSuccessResult(profileResult)) {
    redirect("/login");
  }

  return (
    <div>
      <h2 className="text-h2 mb-2xl">Profile</h2>

      <div className="gap-2xl flex flex-col">
        <ProfileSettingsForm
          currentUsername={profileResult.data.profile.username}
          currentAvatar={profileResult.data.profile.image}
        />

        <Card className="hover:none w-full">
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
            <CardDescription>
              Control who can see your profile and library
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileVisibilityToggle
              isPublicProfile={profileResult.data.profile.isPublicProfile}
              username={profileResult.data.profile.username ?? ""}
            />
            {profileResult.data.profile.isPublicProfile &&
              profileResult.data.profile.username && (
                <Link
                  href={`/u/${profileResult.data.profile.username}`}
                  className="text-primary hover:text-primary/80 inline-block text-sm font-medium underline-offset-4 hover:underline"
                >
                  Preview public profile →
                </Link>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
