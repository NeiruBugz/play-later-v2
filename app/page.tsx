import { auth } from "@/auth";
import { SignIn } from "@/src/components/auth/sign-in";
import { SiteFooter } from "@/src/components/shared/page-footer";
import { SiteHeader } from "@/src/components/shared/page-header";
import { redirect } from "next/navigation";

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
      </section>
      <SiteFooter />
    </div>
  );
}
