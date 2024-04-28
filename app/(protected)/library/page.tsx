import { LibraryContent } from "@/app/(protected)/library/components/library/page/content";
import { Header } from "@/app/(protected)/library/components/library/page/header";
import { ListSkeleton } from "@/app/(protected)/library/components/library/page/list-skeleton";
import { getGamesListWithAdapter } from "@/app/(protected)/library/lib/actions/get-games";
import { auth } from "@/auth";
import { LibraryPageProps } from "@/lib/types/library";
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
