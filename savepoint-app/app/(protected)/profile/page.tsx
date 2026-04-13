import {
  isSuccessResult,
  ProfileService,
  ServiceErrorCode,
} from "@/data-access-layer/services";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your SavePoint profile and library stats",
};

export default async function ProfilePage() {
  const userId = await requireServerUserId();
  const logger = createLogger({ [LOGGER_CONTEXT.PAGE]: "ProfilePage" });
  const service = new ProfileService();
  const result = await service.getProfileWithStats({ userId });
  if (!isSuccessResult(result)) {
    logger.error(
      { error: result.error, code: result.code },
      "Failed to load profile"
    );
    if (result.code === ServiceErrorCode.NOT_FOUND) {
      redirect("/login");
    }
    redirect("/error");
  }
  const username = result.data.profile.username;
  if (!username) {
    redirect("/profile/setup");
  }
  redirect(`/u/${username}`);
}
