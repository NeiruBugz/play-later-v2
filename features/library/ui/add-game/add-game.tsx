"use client"

import React from "react"
import { AddForm } from "@/features/library/ui/add-game/form"
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
  const [isSheetOpen, setSheetOpen] = React.useState(false)
  return (
    <Sheet onOpenChange={setSheetOpen} open={isSheetOpen}>
      <SheetTrigger asChild>
        <Button className="flex w-full justify-between gap-2">
          <PlusCircle className="h-4 w-4 md:mr-2" />
          <span className="hidden whitespace-nowrap md:block">Add game</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full md:w-4/12">
        <SheetHeader>
          <SheetTitle>Add game to library</SheetTitle>
        </SheetHeader>
        <AddForm afterSubmit={setSheetOpen} />
      </SheetContent>
    </Sheet>
  )
}
