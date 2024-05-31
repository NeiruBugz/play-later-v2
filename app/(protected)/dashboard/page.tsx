import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Dashboard } from "@/src/views/dashboard";

import { getUserData } from "@/src/entities/user/api/get-user-data";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const user = await getUserData();

  return <Dashboard username={user?.name || user?.username} />;
}
