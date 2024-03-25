import {
  fetchAndProcessGames,
  setDefaultProps,
} from "@/features/library/helpers";
import { LibraryContent } from "@/features/library/ui/content";
import { Header } from "@/features/library/ui/header";

import { LibraryPageProps } from "@/types/library";

export default async function LibraryPage({
  searchParams = setDefaultProps(),
}: LibraryPageProps) {
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
