export const STEAM_IMAGE_TYPES = {
  HEADER: "header",
  CAPSULE_616: "capsule_616x353",
  CAPSULE_467: "capsule_467x181",
  CAPSULE_231: "capsule_231x87",
  LIBRARY_600: "library_600x900",
  LIBRARY_HERO: "library_hero",
} as const;
export function buildSteamStoreImageUrl(
  appId: string | number | null | undefined,
  imageType: keyof typeof STEAM_IMAGE_TYPES = "HEADER"
): string {
  if (appId === null || appId === undefined) {
    throw new Error("App ID is required");
  }
  const imageTypePath = STEAM_IMAGE_TYPES[imageType];
  return `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/${imageTypePath}.jpg`;
}
export function buildSteamImageUrl(
  appId: string | number | null | undefined,
  imageHash: string | null | undefined
): string {
  if (
    appId === null ||
    appId === undefined ||
    imageHash === null ||
    imageHash === undefined
  ) {
    throw new Error("App ID and image hash are required");
  }
  const cleanHash = imageHash.trim();
  if (!/^[a-f0-9]+$/i.test(cleanHash)) {
    throw new Error("Invalid image hash format");
  }
  return `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${appId}/${cleanHash}.jpg`;
}
export function getSteamGameImageUrl(
  appId: string | number | null | undefined,
  iconHash?: string | null,
  logoHash?: string | null,
  preferredImageType: keyof typeof STEAM_IMAGE_TYPES = "HEADER"
): string | null {
  if (appId === null || appId === undefined) return null;
  try {
    return buildSteamStoreImageUrl(appId, preferredImageType);
  } catch (error) {
    try {
      if (logoHash !== undefined) {
        return buildSteamImageUrl(appId, logoHash);
      }
      if (iconHash !== undefined) {
        return buildSteamImageUrl(appId, iconHash);
      }
    } catch (fallbackError) {
      throw new Error("Failed to build Steam image URL", {
        cause: fallbackError,
      });
    }
    throw new Error("Failed to build Steam image URL", {
      cause: error,
    });
  }
}
