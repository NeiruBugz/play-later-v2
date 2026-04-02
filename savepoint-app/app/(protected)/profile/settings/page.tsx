import { isSuccessResult, ProfileService } from "@/data-access-layer/services";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ProfileSettingsForm,
  ProfileVisibilityToggle,
} from "@/features/profile";
import { SteamConnectCard } from "@/features/steam-import";
import { BrowserBackButton } from "@/shared/components/browser-back-button";
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

export default async function ProfileSettingsPage() {
  const userId = await requireServerUserId();
  const profileService = new ProfileService();
  const [profileResult, steamResult] = await Promise.all([
    profileService.getProfile({ userId }),
    profileService.getSteamConnectionStatus({ userId }),
  ]);

  if (!isSuccessResult(profileResult)) {
    redirect("/login");
  }

  const steamConnectionStatus = isSuccessResult(steamResult)
    ? steamResult.data
    : { connected: false as const };

  return (
    <main className="py-3xl container mx-auto">
      <div className="gap-lg flex items-start">
        <BrowserBackButton />
        <div className="gap-2xl flex w-full flex-wrap">
          <ProfileSettingsForm
            currentUsername={profileResult.data.profile.username}
            currentAvatar={profileResult.data.profile.image}
          />

          <Card className="hover:none w-full max-w-2xl">
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

          <Card className="hover:none w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Connect your gaming platform accounts to import your library
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2xl">
              <SteamConnectCard initialStatus={steamConnectionStatus} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
