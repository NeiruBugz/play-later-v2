import { getServerUserId } from "@/auth";
import { ProfileService } from "@/data-access-layer/services";
import { redirect } from "next/navigation";

import { ProfileView } from "@/features/profile/ui/profile-view";
import { createLogger } from "@/shared/lib";

export default async function ProfilePage() {
  const userId = await getServerUserId();
  const logger = createLogger({ name: "ProfilePage" });

  if (!userId) {
    redirect("/login");
  }

  const service = new ProfileService();
  const result = await service.getProfileWithStats({ userId });

  if (!result.success) {
    logger.error({ error: result.error }, "Failed to load profile");
    redirect("/login");
  }

  return (
    <main className="container py-8" data-testid="profile-page">
      <ProfileView profile={result.data.profile} />
    </main>
  );
}
