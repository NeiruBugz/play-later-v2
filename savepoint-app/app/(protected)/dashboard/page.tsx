import { ProfileService } from "@/data-access-layer/services";
import { redirect } from "next/navigation";

import { requireServerUserId } from "@/shared/lib/app/auth";

export default async function Page() {
  const userId = await requireServerUserId();

  // Safety guard: if NextAuth didn't redirect a new user, do it here.
  const service = new ProfileService();
  const status = await service.checkSetupStatus({ userId });
  if (status.success && status.data.needsSetup) {
    redirect("/profile/setup");
  }

  return <div>Dashboard</div>;
}
