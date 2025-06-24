import { auth } from "@/auth";
import { BacklogList } from "@/features/view-backlogs/components/backlog-list";
import { Header } from "@/shared/components/header";
import { Body, ResponsiveHeading } from "@/shared/components/typography";
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
          <ResponsiveHeading level={1}>Backlogs</ResponsiveHeading>
          <Body variant="muted">Browse through other users&apos; backlogs</Body>
        </div>
        <Suspense fallback="Loading...">
          <BacklogList />
        </Suspense>
      </div>
    </>
  );
}
