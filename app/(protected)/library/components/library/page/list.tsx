import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function List({
  viewMode,
  children,
}: PropsWithChildren<{ viewMode: "grid" | "list" }>) {
  return (
    <section className="flex w-full flex-col">
      <section
        className={cn(
          "mt-4 flex flex-col flex-wrap justify-center gap-2 md:justify-start",
          { "flex-row": viewMode === "grid" }
        )}
      >
        {children}
      </section>
    </section>
  );
}
