import { GameDetailSkeleton } from "@/features/game-detail/ui/game-detail-skeleton";

/**
 * Loading state for the game detail page.
 * Automatically shown by Next.js 15 while the page is loading.
 */
export default function Loading() {
  return <GameDetailSkeleton />;
}
