"use client";

import type { HowLongToBeatEntry } from "howlongtobeat";
import { PlusCircle } from "lucide-react";
import React from "react";
import { useMediaQuery } from "usehooks-ts";

import { Button } from "@/src/shared/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/src/shared/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/shared/ui/sheet";

import { AddForm } from "@/src/features/add-game-form/ui";

export const AddGame = ({
  label = "Add Game",
}: {
  game?: HowLongToBeatEntry;
  label?: string;
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isOpen, setOpen] = React.useState(false);
  return isDesktop ? (
    <Sheet onOpenChange={setOpen} open={isOpen}>
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
  ) : (
    <Drawer onOpenChange={setOpen} open={isOpen}>
      <DrawerTrigger asChild>
        <Button className={label ? "h-9" : "h-9 w-fit justify-between gap-3"}>
          <PlusCircle className="size-4 md:mr-2" />
          <span className="hidden whitespace-nowrap md:inline-flex">
            {label}
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-3/4 px-4">
        <DrawerHeader className="text-left">
          <DrawerTitle>Add game</DrawerTitle>
        </DrawerHeader>
        <AddForm withDescription={false} />
      </DrawerContent>
    </Drawer>
  );
};
