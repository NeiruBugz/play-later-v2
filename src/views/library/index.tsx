import { Suspense } from "react";

import { ListSkeleton } from "@/src/shared/ui/list-skeleton";

import { LibraryContent } from "@/src/widgets/content";
import { Header, HeaderSkeleton } from "@/src/widgets/library-header";

type LibraryProps = {
  params: URLSearchParams;
  viewMode: "grid" | "list";
};

export function Library({ params, viewMode }: LibraryProps) {
  return (
    <section className="relative">
      <Suspense fallback={<HeaderSkeleton />} key={JSON.stringify(params)}>
        <Header />
      </Suspense>
      <section className="container bg-background">
        <Suspense
          fallback={
            <ListSkeleton key={JSON.stringify(params)} viewMode={viewMode} />
          }
        >
          <LibraryContent searchParams={params} />
        </Suspense>
      </section>
    </section>
  );
}
