"use client";

import { useState } from "react";
import { LibraryFiltersDrawer } from "@/features/library/ui/filters/drawer";
import { LibraryFiltersSheet } from "@/features/library/ui/filters/sheet";
import { useMediaQuery } from "usehooks-ts";

function LibraryFiltersWrapper() {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return isDesktop ? (
    <LibraryFiltersSheet open={open} setOpen={setOpen} />
  ) : (
    <LibraryFiltersDrawer open={open} setOpen={setOpen} />
  );
}

export { LibraryFiltersWrapper };
