import type { ReactNode } from "react";

import type { NavItem } from "@/types/nav";

export type MainNavProps = {
  items: NavItem[];
};

export type RenderWhenProps = {
  condition: boolean;
  fallback?: ReactNode;
};
