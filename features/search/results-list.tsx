"use client"

import Image from "next/image"
import { addToWishlist } from "@/features/wishlist/actions"
import { type HowLongToBeatEntry } from "howlongtobeat"

import { platformEnumToColor } from "@/lib/utils"
import { Badge, ColorVariant } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export function ResultsList({ games }: { games: HowLongToBeatEntry[] }) {
  return (
    <ScrollArea className="mt-2 h-[600px] px-1 2xl:h-[1000px]">
      <ul className="space-y-5 px-1">
        {games.map((entry) => (
          <li key={entry.id} className="flex flex-col gap-2 md:flex-row">
            <Image
              width={200}
              height={200}
              src={entry.imageUrl}
              alt={`${entry.name} artwork`}
              className="h-auto"
            />
            <section className="space-y-2">
              <p className="font-bold">{entry.name}</p>
              <div className="flex flex-wrap gap-2">
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
              <div className="flex flex-wrap gap-2">
                <Button>Add to Library</Button>
                <Button
                  variant="secondary"
                  onClick={() => addToWishlist(entry)}
                >
                  Add to Wishlist
                </Button>
              </div>
            </section>
          </li>
        ))}
      </ul>
    </ScrollArea>
  )
}
