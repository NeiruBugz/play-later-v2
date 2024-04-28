import { FiltersForm } from "@/app/(protected)/library/components/library/filters/form";
import { type LibraryFiltersUIProps } from "@/app/(protected)/library/components/library/filters/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersVertical } from "lucide-react";

function LibraryFiltersSheet({ open, setOpen }: LibraryFiltersUIProps) {
  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <SlidersVertical className="mr-2 size-4" /> Filters
        </Button>
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
