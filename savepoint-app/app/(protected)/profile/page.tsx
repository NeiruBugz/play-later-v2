import { ProfileService, ServiceErrorCode } from "@/data-access-layer/services";
import { redirect } from "next/navigation";

import { ProfileView } from "@/features/profile/ui/profile-view";
import { createLogger } from "@/shared/lib";
import { requireServerUserId } from "@/shared/lib/app/auth";

export default async function ProfilePage() {
  const userId = await requireServerUserId();
  const logger = createLogger({ name: "ProfilePage" });

  if (!userId) {
    redirect("/login");
  }

  const service = new ProfileService();
  const result = await service.getProfileWithStats({ userId });

  if (!result.success) {
    logger.error(
      { err: result.error, code: result.code },
      "Failed to load profile"
    );

    if (result.code === ServiceErrorCode.NOT_FOUND) {
      redirect("/login");
    }

    redirect("/error");
  }

  return (
    <main className="container py-8" data-testid="profile-page">
      <ProfileView profile={result.data.profile} />
    </main>
  );
}
