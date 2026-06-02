/**
 * Rating unit conversions.
 *
 * The user-facing unit is **stars** (0.5–5, half-star precision). The storage
 * unit is an **Int 1–10** (`LibraryItem.rating`) — chosen so half-stars survive
 * without floats. Storage is an implementation detail the user never sees: the
 * URL (`?minRating=3.5`), filter labels, and card all speak stars; only the
 * Prisma `where` clause speaks the Int.
 *
 * Keeping the conversion in one place stops the unit from leaking across the
 * boundary (the bug: `?minRating=7` reading as "7 out of 10" while the UI is a
 * 5-star control).
 */

/** Stars (0.5–5) → storage Int (1–10). */
export function ratingStarsToStorage(stars: number): number {
  return Math.round(stars * 2);
}

/** Storage Int (1–10) → stars (0.5–5). */
export function ratingStorageToStars(storage: number): number {
  return storage / 2;
}
