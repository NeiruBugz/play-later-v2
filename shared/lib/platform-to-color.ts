// Enhanced platform detection with more comprehensive matching
export type PlatformKey =
  | "playstation"
  | "xbox"
  | "nintendo"
  | "steam"
  | "pc"
  | "mobile"
  | "epic"
  | "gog"
  | "unknown";

export function detectPlatform(platform: string): PlatformKey {
  const platformLower = platform.toLowerCase();

  // PlayStation variants
  if (
    platformLower.includes("playstation") ||
    platformLower.includes("ps4") ||
    platformLower.includes("ps5") ||
    platformLower.includes("psvr") ||
    platformLower.includes("vita")
  ) {
    return "playstation";
  }

  // Xbox variants
  if (
    platformLower.includes("xbox") ||
    platformLower.includes("series x") ||
    platformLower.includes("series s") ||
    platformLower.includes("one")
  ) {
    return "xbox";
  }

  // Nintendo variants
  if (
    platformLower.includes("nintendo") ||
    platformLower.includes("switch") ||
    platformLower.includes("wii") ||
    platformLower.includes("3ds") ||
    platformLower.includes("ds")
  ) {
    return "nintendo";
  }

  // Steam variants
  if (
    platformLower.includes("steam") ||
    platformLower.includes("steamvr") ||
    platformLower.includes("steam deck")
  ) {
    return "steam";
  }

  // PC variants
  if (
    platformLower.includes("pc") ||
    platformLower.includes("windows") ||
    platformLower.includes("linux") ||
    platformLower.includes("mac")
  ) {
    return "pc";
  }

  // Mobile variants
  if (
    platformLower.includes("mobile") ||
    platformLower.includes("android") ||
    platformLower.includes("ios") ||
    platformLower.includes("iphone") ||
    platformLower.includes("ipad")
  ) {
    return "mobile";
  }

  // Epic variants
  if (platformLower.includes("epic") || platformLower.includes("epic games")) {
    return "epic";
  }

  // GOG variants
  if (platformLower.includes("gog") || platformLower.includes("galaxy")) {
    return "gog";
  }

  return "unknown";
}

export function platformToBackgroundColor(
  platform: string,
  variant: "default" | "dark" | "light" = "default"
): string {
  const platformKey = detectPlatform(platform);

  switch (platformKey) {
    case "playstation":
      return variant === "dark"
        ? "bg-playstation-dark"
        : variant === "light"
          ? "bg-playstation-light"
          : "bg-playstation";
    case "xbox":
      return variant === "dark"
        ? "bg-xbox-dark"
        : variant === "light"
          ? "bg-xbox-light"
          : "bg-xbox";
    case "nintendo":
      return variant === "dark"
        ? "bg-nintendo-dark"
        : variant === "light"
          ? "bg-nintendo-light"
          : "bg-nintendo";
    case "steam":
      return variant === "dark"
        ? "bg-steam-dark"
        : variant === "light"
          ? "bg-steam-light"
          : "bg-steam";
    case "pc":
      return variant === "dark"
        ? "bg-pc-dark"
        : variant === "light"
          ? "bg-pc-light"
          : "bg-pc";
    case "mobile":
      return variant === "dark"
        ? "bg-mobile-dark"
        : variant === "light"
          ? "bg-mobile-light"
          : "bg-mobile";
    case "epic":
      return variant === "dark"
        ? "bg-epic-dark"
        : variant === "light"
          ? "bg-epic-light"
          : "bg-epic";
    case "gog":
      return variant === "dark"
        ? "bg-gog-dark"
        : variant === "light"
          ? "bg-gog-light"
          : "bg-gog";
    default:
      return "bg-gaming-primary";
  }
}

export function platformToTextColor(
  platform: string,
  variant: "default" | "dark" | "light" = "default"
): string {
  const platformKey = detectPlatform(platform);

  switch (platformKey) {
    case "playstation":
      return variant === "dark"
        ? "text-playstation-dark"
        : variant === "light"
          ? "text-playstation-light"
          : "text-playstation";
    case "xbox":
      return variant === "dark"
        ? "text-xbox-dark"
        : variant === "light"
          ? "text-xbox-light"
          : "text-xbox";
    case "nintendo":
      return variant === "dark"
        ? "text-nintendo-dark"
        : variant === "light"
          ? "text-nintendo-light"
          : "text-nintendo";
    case "steam":
      return variant === "dark"
        ? "text-steam-dark"
        : variant === "light"
          ? "text-steam-light"
          : "text-steam";
    case "pc":
      return variant === "dark"
        ? "text-pc-dark"
        : variant === "light"
          ? "text-pc-light"
          : "text-pc";
    case "mobile":
      return variant === "dark"
        ? "text-mobile-dark"
        : variant === "light"
          ? "text-mobile-light"
          : "text-mobile";
    case "epic":
      return variant === "dark"
        ? "text-epic-dark"
        : variant === "light"
          ? "text-epic-light"
          : "text-epic";
    case "gog":
      return variant === "dark"
        ? "text-gog-dark"
        : variant === "light"
          ? "text-gog-light"
          : "text-gog";
    default:
      return "text-gaming-primary";
  }
}

export function platformToBorderColor(
  platform: string,
  variant: "default" | "dark" | "light" = "default"
): string {
  const platformKey = detectPlatform(platform);

  switch (platformKey) {
    case "playstation":
      return variant === "dark"
        ? "border-blue-700"
        : variant === "light"
          ? "border-blue-200"
          : "border-blue-500";
    case "xbox":
      return variant === "dark"
        ? "border-green-700"
        : variant === "light"
          ? "border-green-200"
          : "border-green-500";
    case "nintendo":
      return variant === "dark"
        ? "border-red-700"
        : variant === "light"
          ? "border-red-200"
          : "border-red-500";
    case "steam":
      return variant === "dark"
        ? "border-slate-700"
        : variant === "light"
          ? "border-slate-200"
          : "border-slate-500";
    case "pc":
      return variant === "dark"
        ? "border-gray-700"
        : variant === "light"
          ? "border-gray-200"
          : "border-gray-500";
    case "mobile":
      return variant === "dark"
        ? "border-purple-700"
        : variant === "light"
          ? "border-purple-200"
          : "border-purple-500";
    case "epic":
      return variant === "dark"
        ? "border-orange-700"
        : variant === "light"
          ? "border-orange-200"
          : "border-orange-500";
    case "gog":
      return variant === "dark"
        ? "border-indigo-700"
        : variant === "light"
          ? "border-indigo-200"
          : "border-indigo-500";
    default:
      return "border-neutral-300";
  }
}

export function platformToColorBadge(
  platform: string,
  variant: "default" | "dark" | "light" = "default"
): string {
  const textColor = platformToTextColor(platform, variant);
  const borderColor = platformToBorderColor(platform, variant);
  return `${textColor} ${borderColor} bg-transparent`;
}

export function platformToGradientBadge(platform: string): string {
  const platformKey = detectPlatform(platform);

  switch (platformKey) {
    case "playstation":
      return "bg-gradient-to-r from-blue-600 to-blue-400 text-white";
    case "xbox":
      return "bg-gradient-to-r from-green-600 to-green-400 text-white";
    case "nintendo":
      return "bg-gradient-to-r from-red-600 to-red-400 text-white";
    case "steam":
      return "bg-gradient-to-r from-gray-700 to-gray-500 text-white";
    case "pc":
      return "bg-gradient-to-r from-slate-700 to-slate-500 text-white";
    case "mobile":
      return "bg-gradient-to-r from-purple-600 to-purple-400 text-white";
    case "epic":
      return "bg-gradient-to-r from-indigo-600 to-indigo-400 text-white";
    case "gog":
      return "bg-gradient-to-r from-rose-600 to-rose-400 text-white";
    default:
      return "bg-gradient-to-r from-gray-700 to-gray-500 text-white";
  }
}

// Helper function to get platform display name
export function platformToDisplayName(platform: string): string {
  const platformKey = detectPlatform(platform);

  switch (platformKey) {
    case "playstation":
      return "PlayStation";
    case "xbox":
      return "Xbox";
    case "nintendo":
      return "Nintendo";
    case "steam":
      return "Steam";
    case "pc":
      return "PC";
    case "mobile":
      return "Mobile";
    case "epic":
      return "Epic Games";
    case "gog":
      return "GOG";
    default:
      return platform;
  }
}

// Helper function to get platform icon (for future use)
export function platformToIcon(platform: string): string {
  const platformKey = detectPlatform(platform);

  switch (platformKey) {
    case "playstation":
      return "🎮"; // Could be replaced with actual icons
    case "xbox":
      return "🎮";
    case "nintendo":
      return "🎮";
    case "steam":
      return "💨";
    case "pc":
      return "💻";
    case "mobile":
      return "📱";
    case "epic":
      return "🎮";
    case "gog":
      return "🎮";
    default:
      return "🎮";
  }
}
