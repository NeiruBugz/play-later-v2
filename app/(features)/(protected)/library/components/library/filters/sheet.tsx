import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { FiltersForm } from "@/app/(features)/(protected)/library/components/library/filters/form";
import { type LibraryFiltersUIProps } from "@/app/(features)/(protected)/library/components/library/filters/types";

function LibraryFiltersSheet({ open, setOpen }: LibraryFiltersUIProps) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Filters</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <div className="mb-2">
          <FiltersForm toggleOpen={setOpen} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { LibraryFiltersSheet };
