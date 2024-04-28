import type { NavItem } from "@/lib/types/nav";
import type { ReactNode } from "react";

export type MainNavProps = {
  items: NavItem[];
};

export type RenderWhenProps = {
  condition: boolean;
  fallback?: ReactNode;
};
