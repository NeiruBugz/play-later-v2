import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import { SignIn } from "@/app/login/components/sign-in";
import {
  TrendingList,
  TrendingListSkeleton,
} from "@/app/login/components/trending-list";

export default async function Page() {
  const session = await auth();

  if (session) {
    redirect("/library?status=INPROGRESS");
  }

  return (
    <div className="min-h-screen flex-1">
      <SiteHeader />
      <section className="container flex columns-2 flex-col items-center md:h-[calc(100vh-64px-48px)] md:flex-row md:justify-center">
        <div className="md:max-w-[50%]">
          <h1 className="text-3xl font-bold tracking-tighter lg:text-5xl">
            Play Later
          </h1>
          <p className="my-4 text-xl tracking-tighter text-gray-500 dark:text-gray-400 md:max-w-[50%] xl:text-2xl">
            Play Later is a game library that allows you to save games you want
            to play later. You can also save games you want to play next time
            you log in.
          </p>
          <SignIn />
        </div>
        <div className="mb-8 md:m-0 md:max-w-[50%]">
          <h2 className="scroll-m-20 pb-2 text-center text-3xl font-semibold tracking-tight first:mt-0">
            Trending now
          </h2>
          <Suspense fallback={<TrendingListSkeleton />}>
            <TrendingList />
          </Suspense>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
