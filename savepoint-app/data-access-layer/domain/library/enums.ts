/**
 * Domain enums for library functionality.
 * These are independent from Prisma and represent the application's business domain.
 */

/**
 * Represents the current status of a game in the user's library.
 */
export enum LibraryItemStatus {
  /**
   * Game is on the wishlist, not yet acquired
   */
  WISHLIST = "WISHLIST",
  /**
   * User is interested in the game but hasn't started playing
   */
  CURIOUS_ABOUT = "CURIOUS_ABOUT",
  /**
   * User is actively playing the game
   */
  CURRENTLY_EXPLORING = "CURRENTLY_EXPLORING",
  /**
   * User has paused playing the game
   */
  TOOK_A_BREAK = "TOOK_A_BREAK",
  /**
   * User has completed/experienced the game
   */
  EXPERIENCED = "EXPERIENCED",
  /**
   * User is playing the game again
   */
  REVISITING = "REVISITING",
}

/**
 * Represents how the user acquired the game.
 */
export enum AcquisitionType {
  /**
   * Digital purchase (downloaded)
   */
  DIGITAL = "DIGITAL",
  /**
   * Physical copy (disc, cartridge)
   */
  PHYSICAL = "PHYSICAL",
  /**
   * Subscription service (Game Pass, PS Plus, etc.)
   */
  SUBSCRIPTION = "SUBSCRIPTION",
  /**
   * Gift from someone else
   */
  GIFT = "GIFT",
  /**
   * Free to play
   */
  FREE = "FREE",
}
