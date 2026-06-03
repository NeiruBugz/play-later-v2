import type { ReactNode } from "react";

export type RelatedPanelProps = {
  /**
   * Suspense-wrapped related-games slot supplied by the route. The widget
   * stays prop-driven; the route owns the Suspense + Await + error boundary.
   */
  children: ReactNode;
};
