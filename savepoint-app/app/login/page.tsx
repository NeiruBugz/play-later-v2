import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { AuthPageView } from "@/features/auth/ui/auth-page-view";

export default async function AuthPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  return <AuthPageView />;
}
