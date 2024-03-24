import type { PropsWithChildren } from "react";

import type { RenderWhenProps } from "@/types/ui";

export function RenderWhen({
  condition,
  children,
  fallback,
}: PropsWithChildren<RenderWhenProps>) {
  if (condition) {
    return children;
  }

  return fallback ?? null;
}
