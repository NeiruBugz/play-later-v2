import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib/utils";

type SectionLabelElement = "h2" | "h3" | "h4" | "p" | "span";

export type SectionLabelProps = ComponentPropsWithoutRef<"h2"> & {
  as?: SectionLabelElement;
};

export function SectionLabel({
  as: Element = "h2",
  className,
  ...props
}: SectionLabelProps) {
  return (
    <Element
      data-slot="section-label"
      className={cn("text-sm font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}
