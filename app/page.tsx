import { auth } from "@/auth";
import { BacklogCount } from "@/slices/dashboard/widgets/backlog-count";
import { CurrentlyPlaying } from "@/slices/dashboard/widgets/currently-playing";
import { UpcomingReleases } from "@/slices/dashboard/widgets/upcoming-releases";
import { SignIn } from "@/src/features/sign-in";
import { Header } from "@/src/widgets/header";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="min-h-screen flex-1">
        <section className="container flex h-screen columns-2 flex-col items-center justify-center md:h-[calc(100vh-64px-48px)] md:flex-row md:justify-center">
          <div className="md:max-w-[50%]">
            <h1 className="text-3xl font-bold tracking-tighter lg:text-5xl">
              Play Later
            </h1>
            <SignIn />
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      <Header />
      <section className="container mt-2 pt-[60px]">
        <h1 className="font-bold md:text-xl xl:text-2xl">
          Hi, {session.user.name}
        </h1>
        <section className="mt-2 flex max-w-[100vw] flex-col justify-evenly gap-3 md:flex-row">
          <UpcomingReleases />
          <Suspense fallback={"Loading..."}>
            <BacklogCount />
          </Suspense>
          <Suspense>
            <CurrentlyPlaying />
          </Suspense>
        </section>
      </section>
    </>
  );
}
