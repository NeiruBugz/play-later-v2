import React from "react"
import { AddForm } from "@/features/library/add-game/form"
import { PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export default function AddGame() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="flex justify-between gap-5">
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Add game</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-1/2">
        <SheetHeader>
          <SheetTitle>Add game to library</SheetTitle>
        </SheetHeader>
        <AddForm />
      </SheetContent>
    </Sheet>
  )
}
