import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { BacklogList } from "@/features/view-backlogs/components";
import { EditorialHeader } from "@/shared/components/header";
import { Body, ResponsiveHeading } from "@/shared/components/typography";

export default async function BacklogsPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }
  return (
    <>
      <EditorialHeader authorized />
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
