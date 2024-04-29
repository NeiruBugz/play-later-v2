import { auth } from "@/auth";
import { LibraryContent } from "@/src/components/library/library/page/content";
import { Header } from "@/src/components/library/library/page/header";
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
      <Header />
      <section className="container bg-background">
        <Suspense fallback={<ListSkeleton viewMode={viewMode} />}>
          <LibraryContent
            searchParams={params}
          />
        </Suspense>
      </section>
    </section>
  );
}
