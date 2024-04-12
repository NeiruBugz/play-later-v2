import { LibraryPageProps } from "@/lib/types/library";

import { LibraryContent } from "@/app/(protected)/library/components/library/page/content";
import { Header } from "@/app/(protected)/library/components/library/page/header";
import { getGamesListWithAdapter } from "@/app/(protected)/library/lib/actions/get-games";

export const dynamic = "force-dynamic";

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = new URLSearchParams(searchParams);
  const { list, currentStatus, totalBacklogTime, backlogged } =
    await getGamesListWithAdapter(params);
  return (
    <section className="relative">
      <Header currentStatus={currentStatus} backlogged={backlogged} />
      <section className="container bg-background">
        <LibraryContent
          list={list}
          currentStatus={currentStatus}
          totalBacklogTime={totalBacklogTime}
          backloggedLength={backlogged.length}
        />
      </section>
    </section>
  );
}
