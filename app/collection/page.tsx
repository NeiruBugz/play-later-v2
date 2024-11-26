import { auth } from "@/auth";
import { CollectionList } from "@/src/widgets/collection-list";
import { Header } from "@/src/widgets/header";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function CollectionPage(props: {
  params: Record<string, string>;
  searchParams: Record<string, string>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <>
      <Header />
      <div className="container mx-auto overflow-hidden px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-2 flex justify-between">
          <h1 className="font-bold md:text-xl xl:text-2xl">Collection</h1>
        </div>
        <Suspense fallback={"Loading..."}>
          <CollectionList params={props.searchParams} />
        </Suspense>
      </div>
    </>
  );
}
