import { auth } from "@/auth";
import { getGamesListWithAdapter } from "@/src/actions/library/get-games";
import { LibraryContent } from "@/src/components/library/library/page/content";
import { Header } from "@/src/components/library/library/page/header";
import { ListSkeleton } from "@/src/components/library/library/page/list-skeleton";
import { LibraryPageProps } from "@/src/types/library/components";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const params = new URLSearchParams(searchParams);
  const { backlogged, currentStatus, list, totalBacklogTime } =
    await getGamesListWithAdapter(params);
  const viewMode = params?.get("viewMode") ?? "list";
  return (
    <section className="relative">
      <Header backlogged={backlogged} currentStatus={currentStatus} />
      <section className="container bg-background">
        <Suspense fallback={<ListSkeleton viewMode={viewMode} />}>
          <LibraryContent
            backloggedLength={backlogged.length}
            currentStatus={currentStatus}
            list={list}
            totalBacklogTime={totalBacklogTime}
            viewMode={viewMode}
          />
        </Suspense>
      </section>
    </section>
  );
}
