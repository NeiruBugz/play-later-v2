"use client"

import { PlusCircle } from "lucide-react"

import { useSearch } from "@/lib/query"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export default function AddGame() {
  const { mutateAsync: search, data } = useSearch()
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="flex justify-between gap-5">
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Add game</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add game to library</SheetTitle>
        </SheetHeader>
        <Button onClick={() => search("zelda")}>Search for zelda</Button>
      </SheetContent>
    </Sheet>
  )
}
