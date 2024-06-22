import { auth } from "@/auth";
import { CollectionList } from "@/src/widgets/collection-list";
import { Header } from "@/src/widgets/header";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function CollectionPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }
  return (
    <>
      <Header/>
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="flex justify-between mb-2">
          <h1 className="font-bold md:text-xl xl:text-2xl">Collection</h1>
          <Link href="/collection/add-game" className="font-bold hover:underline cursor-pointer">Add Game</Link>
        </div>
        <Suspense fallback={"Loading..."}>
          <CollectionList/>
        </Suspense>
      </div>
    </>
  );
}
