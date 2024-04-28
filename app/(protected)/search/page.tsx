import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/lib/config/site";
import igdbApi from "@/src/lib/igdb-api";
import { SearchPageProps } from "@/src/types/search";
import Image from "next/image";
import Link from "next/link";

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
                  <Link href={`/game/${entry.id}`} key={entry.id}>
                    <li
                      className="flex h-full w-[264px] flex-col justify-between gap-3"
                      key={entry.id}
                    >
                      <figure>
                        <div className=" relative aspect-[3/4] cursor-pointer rounded-xl border transition md:hover:brightness-110">
                          <Image
                            alt={`${entry.name} artwork`}
                            className="h-full w-full rounded-xl  object-cover"
                            height={NEXT_IMAGE_SIZES["c-big"].height}
                            src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${entry.cover?.image_id}.png`}
                            width={NEXT_IMAGE_SIZES["c-big"].width}
                          />
                        </div>
                        <figcaption className="mt-2.5 line-clamp-3	text-center text-xs font-bold sm:mt-3 sm:text-base">
                          {entry.name}
                        </figcaption>
                      </figure>
                    </li>
                  </Link>
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
