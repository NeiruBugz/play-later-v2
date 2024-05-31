import { SlidersVertical } from "lucide-react";

import { Button } from "@/src/shared/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/src/shared/ui/drawer";

import { FiltersForm } from "./form";
import type { LibraryFiltersUIProps } from "./types";

function LibraryFiltersDrawer({ open, setOpen }: LibraryFiltersUIProps) {
  return (
    <Drawer onOpenChange={setOpen} open={open}>
      <DrawerTrigger asChild>
        <Button variant="outline">
          <SlidersVertical className="mr-2 size-4" /> Filters
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DrawerDescription>
        </DrawerHeader>
        <div className="mb-2 px-4">
          <FiltersForm toggleOpen={setOpen} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export { LibraryFiltersDrawer };
