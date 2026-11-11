# up-next-shelf

Presentation of the Up Next queue on home: a horizontal scroll-snap row of covers in the order the data arrives (never re-sorted). The first item is larger and marked `data-next="true"` / `aria-current="true"`.

- First cover width is `min(68vw, 17rem)` on a phone so the second always peeks; the rest are `w-36`. Desktop: `w-72` / `w-40`.
- `min-w-0` on the section and `overscroll-x-contain` on the scroller keep the page from scrolling sideways. The scroller carries `data-scroller`.
- The empty state keeps the shelf's outline (same height as the first cover) and its button calls `openCommandPalette` from `features/command-palette`.
- Data and actions are spec 026's: a cover links to the game page; "See all" opens the library's Up Next view. Reordering and removing stay in the library's queue list.
- Consumed by `widgets/dashboard-page` (documented widget-to-widget carve-out in `DIVERGENCES.md`).
