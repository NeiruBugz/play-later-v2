import Image from "next/image"
import { AddForm } from "@/features/library/ui/add-game/form"
import { AddGameDialog } from "@/features/lists/add-game-dialog"
import { AddDialog } from "@/features/search/add-dialog"
import { AddFromSearch } from "@/features/wishlist/ui/add-from-search"

import { searchHowLongToBeat } from "@/lib/hltb-search"
import { platformEnumToColor } from "@/lib/utils"
import { Badge, ColorVariant } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

type SearchPageProps = {
  params: {}
  searchParams: URLSearchParams
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = new URLSearchParams(searchParams).get("q")
  const results = await searchHowLongToBeat(query)
  return (
    <section className="bg-background p-4 md:container">
      <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight md:text-3xl lg:text-4xl">
        Results for {query}: {results.length} games were found
      </h1>
      <section className="py-4">
        {/* <SearchForm /> */}
        <ScrollArea className="mt-2 h-[600px] px-1 2xl:h-[1000px]">
          <ul className="space-y-5">
            {results.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-2 md:flex-row">
                <Image
                  width={200}
                  height={200}
                  src={entry.imageUrl}
                  alt={`${entry.name} artwork`}
                  className="h-auto w-[200px]"
                />
                <section className="space-y-2">
                  <p className="font-bold">{entry.name}</p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {entry.platforms.map((platform) => (
                      <Badge
                        key={platform}
                        variant={platformEnumToColor(platform) as ColorVariant}
                        className="h-fit"
                      >
                        {platform}
                      </Badge>
                    ))}
                  </div>
                  <AddDialog entry={JSON.stringify(entry)} />
                </section>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </section>
    </section>
  )
}
