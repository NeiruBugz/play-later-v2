import type { PropsWithChildren, ReactNode } from "react";

type RenderWhenProps = {
  condition: boolean;
  fallback?: ReactNode;
};
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
