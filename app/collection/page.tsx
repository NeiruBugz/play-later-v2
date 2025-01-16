import { auth } from "@/auth";
import { CollectionList } from "@/slices/collection/widgets";
import { Header } from "@/src/widgets/header";
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

  return (
    <>
      <Header />
      <div className="container overflow-hidden py-8 pt-[60px]">
        <div className="mb-2 flex justify-between">
          <h1 className="font-bold md:text-xl xl:text-2xl">Collection</h1>
        </div>
        <Suspense fallback={"Loading..."}>
          <CollectionList params={await props.searchParams} />
        </Suspense>
      </div>
    </>
  );
}
