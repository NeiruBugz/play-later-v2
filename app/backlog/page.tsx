import { auth } from "@/auth";
import { Header } from "@/shared/components/header";
import { BacklogList } from "@/features/view-backlogs/components/backlog-list";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function BacklogsPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }
  return (
    <>
      <Header />
      <div className="container pt-[60px]">
        <Suspense fallback="Loading...">
          <BacklogList />
        </Suspense>
      </div>
    </>
  );
}
