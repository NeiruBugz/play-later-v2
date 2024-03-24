import Image from "next/image";
import type { SearchPageProps } from "@/features/search/types";

import { ScrollArea } from "@/components/ui/scroll-area";

import igdbApi from "@/lib/igdb-api";

import { IMAGE_API, IMAGE_SIZES } from "@/config/site";

type IgdbPlatform = {
  id: number;
  name: string;
};

type IgdbSearchResponse = {
  id: number;
  name: string;
  platforms: Array<IgdbPlatform>;
  cover: {
    id: number;
    image_id: string;
  };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = new URLSearchParams(searchParams).get("q");
  const results: IgdbSearchResponse[] | undefined = await igdbApi.search({
    name: query,
  });

  console.log(results);

  return (
    <section className="container bg-background">
      {results?.length ? (
        <>
          <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight md:text-3xl lg:text-4xl">
            Results for {query}: {results?.length} games were found
          </h1>
          <section className="py-4">
            <ScrollArea className="mt-2 h-[600px] px-1 2xl:h-[1000px]">
              <ul className="grid grid-flow-row grid-cols-1 items-center justify-items-center gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results?.map((entry) => (
                  <li key={entry.id} className="flex w-[264px] flex-col gap-2">
                    <figure>
                      <div className="c-bg-dark-blue relative aspect-[3/4] rounded-xl transition md:hover:brightness-110">
                        <Image
                          src={`${IMAGE_API}/${IMAGE_SIZES["c-big"]}/${entry.cover?.image_id}.png`}
                          alt={`${entry.name} artwork`}
                          className="h-full w-full rounded-xl border object-cover"
                          unoptimized
                          fill
                        />
                      </div>
                      <figcaption>
                        <p className="mt-2.5 line-clamp-3	text-center text-xs font-bold sm:mt-3 sm:text-base">
                          {entry.name}
                        </p>
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </section>
        </>
      ) : (
        <p>no games found</p>
      )}
    </section>
  );
}
