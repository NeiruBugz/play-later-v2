import Link from "next/link";
import { SearchPageProps } from "@/src/types/search";
import igdbApi from "@/src/shared/api/igdb";
import { CustomImage } from "@/src/shared/ui/custom-image";
import { ScrollArea } from "@/src/shared/ui/scroll-area";

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
                          <CustomImage
                            alt={`${entry.name} artwork`}
                            className="h-full w-full rounded-xl  object-cover"
                            imageUrl={entry.cover?.image_id}
                            size="c-big"
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
