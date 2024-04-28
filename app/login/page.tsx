import { auth } from "@/auth";
import { SiteFooter } from "@/src/components/shared/page-footer";
import { SiteHeader } from "@/src/components/shared/page-header";
import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/lib/config/site";
import igdbApi from "@/src/lib/igdb-api";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  const trendingGames = await igdbApi.getGamesByRating();

  if (session) {
    redirect("/library?status=INPROGRESS");
  }

  return (
    <div className="min-h-screen flex-1">
      <SiteHeader />
      <section className="container mb-8 flex h-full  columns-2 flex-col items-center md:h-[calc(100vh-64px-48px)] md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter lg:text-5xl">
            Play Later
          </h1>
          <p className="my-4 text-xl tracking-tighter text-gray-500 dark:text-gray-400 md:max-w-[50%] xl:text-2xl">
            Play Later is a game library that allows you to save games you want
            to play later. You can also save games you want to play next time
            you log in.
          </p>
        </div>
        <div className="mb-8">
          <h2 className="scroll-m-20 pb-2 text-center text-3xl font-semibold tracking-tight first:mt-0">
            Trending now
          </h2>
          <div className="columns-3">
            {trendingGames?.map((game) => {
              return (
                <Image
                  alt={`${game.name} cover`}
                  className="mb-2 rounded-md"
                  height={NEXT_IMAGE_SIZES["logo"].height}
                  key={game.id}
                  priority
                  src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.cover.image_id}.png`}
                  style={{
                    height: "auto",
                    width: 120,
                  }}
                  width={NEXT_IMAGE_SIZES["logo"].width}
                />
              );
            })}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
