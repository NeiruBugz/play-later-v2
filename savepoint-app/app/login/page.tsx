import { getServerUserId } from "@/auth";
import { redirect } from "next/navigation";

import { AuthPageView } from "@/features/auth";
import { MigrationNotice } from "@/features/auth/index.server";

export default async function AuthPage() {
  const userId = await getServerUserId();
  if (userId) {
    redirect("/dashboard");
  }
  return <AuthPageView notice={<MigrationNotice />} />;
}
