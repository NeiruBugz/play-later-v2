import type { NavItem } from "@/src/types/shared/index";
import type { ReactNode } from "react";

export type MainNavProps = {
  items: NavItem[];
};

export type RenderWhenProps = {
  condition: boolean;
  fallback?: ReactNode;
};
