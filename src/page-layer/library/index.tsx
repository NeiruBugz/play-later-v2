import { Suspense } from "react";
import { LibraryContent } from "@/src/components/library/library/page/content";
import {
  Header,
  HeaderSkeleton,
} from "@/src/components/library/library/page/header";
import { ListSkeleton } from "@/src/components/shared/list-skeleton";

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
