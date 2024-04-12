import { SlidersVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { FiltersForm } from "@/app/(protected)/library/components/library/filters/form";
import { type LibraryFiltersUIProps } from "@/app/(protected)/library/components/library/filters/types";

function LibraryFiltersDrawer({ open, setOpen }: LibraryFiltersUIProps) {
  return (
    <Drawer open={open} onOpenChange={setOpen}>
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
