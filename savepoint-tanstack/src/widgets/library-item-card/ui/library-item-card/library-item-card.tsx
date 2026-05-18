import { LibraryStatusBadge } from "@/entities/library-item";
import { GameCard } from "@/widgets/game-card";

import type { LibraryItemCardProps } from "./library-item-card.type";

/**
 * Library list card. Composes `GameCard` (cover + clamped title) with a
 * status badge overlaid top-left of the cover and an optional action-menu
 * slot rendered top-right.
 *
 * Click semantics:
 * - The GameCard body is a TanStack `<Link>` to `/games/$slug`.
 * - The action-menu is rendered as a **sibling** of the link, NOT through
 *   GameCard's `overlay` slot. This is structural — the menu's DOM is
 *   outside the `<a>` element entirely, so clicks on the menu trigger
 *   (or any other interactive surface inside the menu) physically cannot
 *   bubble through the link, regardless of Radix's event-composition
 *   internals, asChild Slot patterns, focus-restoration behavior, or
 *   HTML5 nested-interactive ambiguities.
 * - Radix `DropdownMenuContent` portals to `document.body`, so its items
 *   are likewise outside the link DOM subtree.
 */
export function LibraryItemCard({ item, menu }: LibraryItemCardProps) {
  return (
    <div className="relative">
      <GameCard
        game={{
          slug: item.game.slug,
          title: item.game.title,
          coverImageId: item.game.coverImage,
        }}
        asLink
        density="standard"
        badges={
          <div className="absolute top-2 left-2">
            <LibraryStatusBadge
              status={item.status}
              hasBeenPlayed={item.hasBeenPlayed}
            />
          </div>
        }
      />
      {menu ? <div className="absolute top-2 right-2 z-10">{menu}</div> : null}
    </div>
  );
}
