import { ProfileService } from "@/data-access-layer/services";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { requireServerUserId } from "@/shared/lib/app/auth";
import { NotFoundError } from "@/shared/lib/errors";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your SavePoint profile and library stats",
};

export default async function ProfilePage() {
  const userId = await requireServerUserId();
  const logger = createLogger({ [LOGGER_CONTEXT.PAGE]: "ProfilePage" });
  const service = new ProfileService();

  let profile: Awaited<ReturnType<ProfileService["getProfileWithStats"]>>;
  try {
    profile = await service.getProfileWithStats({ userId });
  } catch (error) {
    if (error instanceof NotFoundError) {
      redirect("/login");
    }
    logger.error({ error, userId }, "Failed to load profile");
    redirect("/error");
  }

  const username = profile.username;
  if (!username) {
    redirect("/profile/setup");
  }
  redirect(`/u/${username}`);
}
