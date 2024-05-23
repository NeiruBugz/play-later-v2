import { auth } from "@/auth";
import { LibraryContent } from "@/src/components/library/library/page/content";
import {
  Header,
  HeaderSkeleton,
} from "@/src/components/library/library/page/header";
import { ListSkeleton } from "@/src/components/shared/list-skeleton";
import { LibraryPageProps } from "@/src/types/library/components";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const params = new URLSearchParams(searchParams);
  const viewMode = params?.get("viewMode") ?? "list";

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
