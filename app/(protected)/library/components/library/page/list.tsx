import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

export function List({
  children,
  viewMode,
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
