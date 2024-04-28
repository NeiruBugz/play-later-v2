"use client";

import { LibraryFiltersDrawer } from "@/app/(protected)/library/components/library/filters/drawer";
import { LibraryFiltersSheet } from "@/app/(protected)/library/components/library/filters/sheet";
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
