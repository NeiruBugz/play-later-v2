/**
 * Domain enums for library functionality.
 * These are independent from Prisma and represent the application's business domain.
 */

/**
 * Represents the current status of a game in the user's library.
 */
export enum LibraryItemStatus {
  /**
   * On your radar, haven't started
   */
  WANT_TO_PLAY = "WANT_TO_PLAY",
  /**
   * In your library, haven't started
   */
  OWNED = "OWNED",
  /**
   * Currently engaged
   */
  PLAYING = "PLAYING",
  /**
   * Have experienced it
   */
  PLAYED = "PLAYED",
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
