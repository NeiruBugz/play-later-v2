import { LibraryPageProps } from "@/lib/types/library";

import { LibraryContent } from "@/app/(features)/(protected)/library/components/library/page/content";
import { Header } from "@/app/(features)/(protected)/library/components/library/page/header";
import {
  fetchAndProcessGames,
  setDefaultProps,
} from "@/app/(features)/(protected)/library/lib/helpers";

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = searchParams
    ? new URLSearchParams(searchParams)
    : setDefaultProps();
  const { list, currentStatus, totalBacklogTime, backlogged } =
    await fetchAndProcessGames(params);
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
