import { auth } from "@/auth";
import { BacklogList } from "@/features/view-backlogs/components/backlog-list";
import { Header } from "@/shared/components/header";
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
      <div className="container overflow-hidden px-4 py-8 pt-[60px]">
        <div className="mb-8 mt-4 flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Backlogs</h1>
          <p className="text-muted-foreground">
            Browse through other users&apos; backlogs
          </p>
        </div>
        <Suspense fallback="Loading...">
          <BacklogList />
        </Suspense>
      </div>
    </>
  );
}
