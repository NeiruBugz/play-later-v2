import type { ReactNode } from "react";

export type GameCoverSize = "xs" | "fluid" | "lg";

export type GameCoverProps = {
  src: string | null | undefined;
  name: string;
  size?: GameCoverSize;
  priority?: boolean;
  className?: string;
  children?: ReactNode;
};
