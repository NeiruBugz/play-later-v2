"use client";

import React from "react";
import { HowLongToBeatEntry } from "howlongtobeat";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { AddForm } from "@/app/(features)/(protected)/library/components/library/add-game/form/form";

export default function AddGame({
  label = "Add Game",
}: {
  label?: string;
  game?: HowLongToBeatEntry;
}) {
  const [isSheetOpen, setSheetOpen] = React.useState(false);
  return (
    <Sheet onOpenChange={setSheetOpen} open={isSheetOpen}>
      <SheetTrigger asChild>
        <Button className={label ? "h-9" : "h-9 w-fit justify-between gap-3"}>
          <PlusCircle className="size-4 md:mr-2" />
          <span className="hidden whitespace-nowrap md:inline-flex">
            {label}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full lg:w-1/2">
        <SheetHeader>
          <SheetTitle>Add game to library</SheetTitle>
        </SheetHeader>
        <AddForm />
      </SheetContent>
    </Sheet>
  );
}
