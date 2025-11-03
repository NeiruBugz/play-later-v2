import { ProfileService, ServiceErrorCode } from "@/data-access-layer/services";
import { redirect } from "next/navigation";

import { ProfileView } from "@/features/profile/ui/profile-view";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { requireServerUserId } from "@/shared/lib/app/auth";

export default async function ProfilePage() {
  const userId = await requireServerUserId(); // Redirects to login if no user
  const logger = createLogger({ [LOGGER_CONTEXT.PAGE]: "ProfilePage" });

  const service = new ProfileService();
  const result = await service.getProfileWithStats({ userId });

  if (!result.success) {
    logger.error(
      { error: result.error, code: result.code },
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
