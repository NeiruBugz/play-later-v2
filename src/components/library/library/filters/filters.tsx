"use client";

import { LibraryFiltersDrawer } from "@/src/components/library/library/filters/drawer";
import { LibraryFiltersSheet } from "@/src/components/library/library/filters/sheet";
import { useState } from "react";
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
