import { getServerUserId } from "@/auth";
import { ProfileService } from "@/data-access-layer/services";
import { redirect } from "next/navigation";

import { ProfileView } from "@/features/profile/ui/profile-view";

export default async function ProfilePage() {
  const userId = await getServerUserId();

  if (!userId) {
    redirect("/login");
  }

  const service = new ProfileService();
  const result = await service.getProfileWithStats({ userId });

  if (!result.success) {
    console.error("Failed to load profile:", result.error);
    redirect("/login");
  }

  return (
    <div className="container max-w-4xl py-8">
      <ProfileView profile={result.data.profile} />
    </div>
  );
}
