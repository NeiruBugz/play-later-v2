/**
 * Domain enums for journal functionality.
 * These are independent from Prisma and represent the application's business domain.
 */

/**
 * Represents the mood associated with a journal entry.
 */
export enum JournalMood {
  /**
   * Feeling excited about the game
   */
  EXCITED = "EXCITED",
  /**
   * Feeling relaxed while playing
   */
  RELAXED = "RELAXED",
  /**
   * Feeling frustrated with the game
   */
  FRUSTRATED = "FRUSTRATED",
  /**
   * Feeling accomplished after achieving something
   */
  ACCOMPLISHED = "ACCOMPLISHED",
  /**
   * Feeling curious about exploring more
   */
  CURIOUS = "CURIOUS",
  /**
   * Feeling nostalgic about the experience
   */
  NOSTALGIC = "NOSTALGIC",
}

/**
 * Represents the visibility level of a journal entry.
 */
export enum JournalVisibility {
  /**
   * Only the user can see the entry
   */
  PRIVATE = "PRIVATE",
  /**
   * Only friends can see the entry (future feature)
   */
  FRIENDS_ONLY = "FRIENDS_ONLY",
  /**
   * Anyone can see the entry
   */
  PUBLIC = "PUBLIC",
}
