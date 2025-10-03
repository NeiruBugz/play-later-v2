import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { BacklogList } from "@/features/view-backlogs/components";
import { Header } from "@/shared/components/header";
import { Body, ResponsiveHeading } from "@/shared/components/typography";
import { Toolbar, ListSearchInput, Pagination, GridSkeleton } from "@/shared/components";

export default async function BacklogsPage(
  props: PageProps<"/backlog">
) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }
  const awaitedSearchParams = await props.searchParams;
  return (
    <>
      <Header authorized />
      <div className="container overflow-hidden px-4 py-8 pt-[60px]">
        <div className="mb-8 mt-4 flex flex-col gap-4">
          <ResponsiveHeading level={1}>Backlogs</ResponsiveHeading>
          <Body variant="muted">Browse through other users&apos; backlogs</Body>
        </div>
        <Toolbar searchSlot={<ListSearchInput placeholder="Search users..." />} />
        <Suspense fallback={<GridSkeleton count={12} />}>
          <BacklogList params={awaitedSearchParams} />
        </Suspense>
      </div>
    </>
  );
}
