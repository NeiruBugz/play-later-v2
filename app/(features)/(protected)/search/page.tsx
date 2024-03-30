import Image from "next/image";

import { ScrollArea } from "@/components/ui/scroll-area";

import { IMAGE_API, IMAGE_SIZES } from "@/lib/config/site";
import igdbApi from "@/lib/igdb-api";

import type { SearchPageProps } from "@/app/(features)/(protected)/search/lib/types";

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = new URLSearchParams(searchParams).get("q");
  const results = await igdbApi.search({
    name: query,
  });

  return (
    <section className="container bg-background">
      {results?.length ? (
        <>
          <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight md:text-3xl lg:text-4xl">
            Results for {query}: {results.length} games were found
          </h1>
          <section className="py-4">
            <ScrollArea className="mt-2 h-[600px] px-1 2xl:h-[1000px]">
              <ul className="grid grid-flow-row grid-cols-1 items-center justify-items-center gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results?.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex h-full w-[264px] flex-col justify-between gap-3"
                  >
                    <figure>
                      <div className=" relative aspect-[3/4] cursor-pointer rounded-xl border transition md:hover:brightness-110">
                        <Image
                          src={`${IMAGE_API}/${IMAGE_SIZES["c-big"]}/${entry.cover?.image_id}.png`}
                          alt={`${entry.name} artwork`}
                          className="h-full w-full rounded-xl  object-cover"
                          unoptimized
                          fill
                        />
                      </div>
                      <figcaption className="mt-2.5 line-clamp-3	text-center text-xs font-bold sm:mt-3 sm:text-base">
                        {entry.name}
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </section>
        </>
      ) : (
        <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight md:text-3xl lg:text-4xl">
          Results for {query}: 0 games were found
        </h1>
      )}
    </section>
  );
}