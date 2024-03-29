import { FiltersForm } from "@/features/library/ui/filters/form";
import { LibraryFiltersUIProps } from "@/features/library/ui/filters/types";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

function LibraryFiltersDrawer({ open, setOpen }: LibraryFiltersUIProps) {
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">Filters</Button>
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
