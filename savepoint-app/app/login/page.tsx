import { redirect } from "next/navigation";

import { AuthPageView } from "@/features/auth/ui/auth-page-view";
import { getOptionalServerUserId } from "@/shared/lib/auth";

export default async function AuthPage() {
  const userId = await getOptionalServerUserId();
  if (userId) {
    redirect("/dashboard");
  }
  return <AuthPageView />;
}
