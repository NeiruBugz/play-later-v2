"use client"

import { addToWishlist } from "@/features/wishlist/actions"
import { HowLongToBeatEntry } from "howlongtobeat"

import { Button } from "@/components/ui/button"

function AddFromSearch({ entry }: { entry: string }) {
  return (
    <Button
      variant="secondary"
      onClick={() => addToWishlist(JSON.parse(entry) as HowLongToBeatEntry)}
    >
      Add to Wishlist
    </Button>
  )
}

export { AddFromSearch }
