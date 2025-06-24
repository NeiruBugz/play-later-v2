import { auth } from "@/auth";
import { CollectionList } from "@/features/view-collection";
import { PlatformFilter } from "@/features/view-collection/components/platform-filter";
import { SearchInput } from "@/features/view-collection/components/search-input";
import { StatusFilter } from "@/features/view-collection/components/status-filter";
import { CollectionViewMode } from "@/features/view-collection/components/view-mode";
import { getUserUniquePlatforms } from "@/features/view-collection/server-actions/get-uniques-platforms";
import { Header } from "@/shared/components/header";
import { Body, ResponsiveHeading } from "@/shared/components/typography";
import { GenericPageProps } from "@/shared/types";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function CollectionPage(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const uniquePlatforms = await getUserUniquePlatforms();
  const awaitedSearchParams = await props.searchParams;

  return (
    <>
      <Header />
      <div className="container overflow-hidden px-4 py-8 pt-[60px]">
        <div className="mb-8 mt-4 flex flex-col gap-4">
          <ResponsiveHeading level={1}>Your Collection</ResponsiveHeading>
          <Body variant="muted">
            Manage and browse through your game library
          </Body>
        </div>
        <div className="mb-8 flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <StatusFilter />
            <CollectionViewMode />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <SearchInput />
            </div>
            <div className="flex flex-wrap gap-2">
              <PlatformFilter platformOptions={uniquePlatforms} />
              {/* <CardViewMode /> */}
            </div>
          </div>
        </div>
        <Suspense fallback={"Loading..."}>
          <CollectionList params={awaitedSearchParams} />
        </Suspense>
      </div>
    </>
  );
}
