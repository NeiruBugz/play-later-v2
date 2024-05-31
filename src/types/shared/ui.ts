import type { ReactNode } from "react";
import type { NavItem } from "@/src/types/shared/index";

export type MainNavProps = {
  items: NavItem[];
};

export type RenderWhenProps = {
  condition: boolean;
  fallback?: ReactNode;
};
