import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

import { LibraryPageProps } from "@/lib/types/library";

import { LibraryContent } from "@/app/(protected)/library/components/library/page/content";
import { Header } from "@/app/(protected)/library/components/library/page/header";
import { ListSkeleton } from "@/app/(protected)/library/components/library/page/list-skeleton";
import { getGamesListWithAdapter } from "@/app/(protected)/library/lib/actions/get-games";

export const dynamic = "force-dynamic";

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const params = new URLSearchParams(searchParams);
  const { list, currentStatus, totalBacklogTime, backlogged } =
    await getGamesListWithAdapter(params);
  const viewMode = params?.get("viewMode") ?? "list";
  return (
    <section className="relative">
      <Header backlogged={backlogged} currentStatus={currentStatus} />
      <section className="container bg-background">
        <Suspense fallback={<ListSkeleton viewMode={viewMode} />}>
          <LibraryContent
            viewMode={viewMode}
            backloggedLength={backlogged.length}
            list={list}
            currentStatus={currentStatus}
            totalBacklogTime={totalBacklogTime}
          />
        </Suspense>
      </section>
    </section>
  );
}
