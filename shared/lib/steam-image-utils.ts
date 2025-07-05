/**
 * Steam image types and their dimensions
 */
export const STEAM_IMAGE_TYPES = {
  HEADER: "header", // 460x215 - Good for card headers
  CAPSULE_616: "capsule_616x353", // 616x353 - High quality
  CAPSULE_467: "capsule_467x181", // 467x181 - Medium quality
  CAPSULE_231: "capsule_231x87", // 231x87 - Smaller but still good
  LIBRARY_600: "library_600x900", // 600x900 - Vertical orientation
  LIBRARY_HERO: "library_hero", // Variable size, usually large
} as const;

/**
 * Constructs Steam store image URLs using app ID
 * These are much higher quality than the 32x32 icons from the API
 *
 * @param appId - Steam app ID
 * @param imageType - Type of image to fetch
 * @returns Steam store image URL
 *
 * @example
 * buildSteamStoreImageUrl(440, "header")
 * // Returns: "https://steamcdn-a.akamaihd.net/steam/apps/440/header.jpg"
 */
export function buildSteamStoreImageUrl(
  appId: string | number,
  imageType: keyof typeof STEAM_IMAGE_TYPES = "HEADER"
): string {
  if (!appId) {
    throw new Error("App ID is required");
  }

  const imageTypePath = STEAM_IMAGE_TYPES[imageType];
  return `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/${imageTypePath}.jpg`;
}

/**
 * Constructs Steam image URLs from app ID and image hash (fallback method)
 *
 * @param appId - Steam app ID (can be string or number)
 * @param imageHash - Image hash from Steam API
 * @param type - Type of image (icon or logo) - currently unused but kept for future use
 * @returns Fully constructed Steam image URL
 *
 * @example
 * buildSteamImageUrl(440, "e3f595a92552da3d664ad00277fad2107345f7e0")
 * // Returns: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/440/e3f595a92552da3d664ad00277fad2107345f7e0.jpg"
 */
export function buildSteamImageUrl(
  appId: string | number,
  imageHash: string,
  type: "icon" | "logo" = "icon"
): string {
  if (!imageHash || !appId) {
    throw new Error("App ID and image hash are required");
  }

  // Remove any whitespace and validate hash format (should be alphanumeric)
  const cleanHash = imageHash.trim();
  if (!/^[a-f0-9]+$/i.test(cleanHash)) {
    throw new Error("Invalid image hash format");
  }

  return `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${appId}/${cleanHash}.jpg`;
}

/**
 * Gets the best available Steam image URL for a game
 * Prioritizes high-quality store images over low-res API icons
 *
 * @param appId - Steam app ID (can be string or number)
 * @param iconHash - Icon image hash from Steam API (optional, used as fallback)
 * @param logoHash - Logo image hash from Steam API (optional, used as fallback)
 * @param preferredImageType - Preferred store image type
 * @returns Best available image URL or null if no images available
 *
 * @example
 * getSteamGameImageUrl("440", "icon_hash", "logo_hash", "HEADER")
 * // Returns high-quality header image URL
 */
export function getSteamGameImageUrl(
  appId: string | number,
  iconHash?: string | null,
  logoHash?: string | null,
  preferredImageType: keyof typeof STEAM_IMAGE_TYPES = "HEADER"
): string | null {
  if (!appId) return null;

  try {
    // Always prefer high-quality store images over low-res API icons
    return buildSteamStoreImageUrl(appId, preferredImageType);
  } catch (error) {
    // Fallback to API-provided images if store images fail
    try {
      // Prefer logo over icon as secondary fallback
      if (logoHash) {
        return buildSteamImageUrl(appId, logoHash, "logo");
      }

      if (iconHash) {
        return buildSteamImageUrl(appId, iconHash, "icon");
      }
    } catch (fallbackError) {
      console.warn("Failed to build Steam image URL:", fallbackError);
    }

    console.warn("Failed to build Steam store image URL:", error);
    return null;
  }
}
