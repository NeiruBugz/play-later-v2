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
        ? "border-playstation-dark"
        : variant === "light"
          ? "border-playstation-light"
          : "border-playstation";
    case "xbox":
      return variant === "dark"
        ? "border-xbox-dark"
        : variant === "light"
          ? "border-xbox-light"
          : "border-xbox";
    case "nintendo":
      return variant === "dark"
        ? "border-nintendo-dark"
        : variant === "light"
          ? "border-nintendo-light"
          : "border-nintendo";
    case "steam":
      return variant === "dark"
        ? "border-steam-dark"
        : variant === "light"
          ? "border-steam-light"
          : "border-steam";
    case "pc":
      return variant === "dark"
        ? "border-pc-dark"
        : variant === "light"
          ? "border-pc-light"
          : "border-pc";
    case "mobile":
      return variant === "dark"
        ? "border-mobile-dark"
        : variant === "light"
          ? "border-mobile-light"
          : "border-mobile";
    case "epic":
      return variant === "dark"
        ? "border-epic-dark"
        : variant === "light"
          ? "border-epic-light"
          : "border-epic";
    case "gog":
      return variant === "dark"
        ? "border-gog-dark"
        : variant === "light"
          ? "border-gog-light"
          : "border-gog";
    default:
      return "border-gaming-primary";
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
      return "bg-gradient-to-r from-playstation-dark to-playstation-light text-white";
    case "xbox":
      return "bg-gradient-to-r from-xbox-dark to-xbox-light text-white";
    case "nintendo":
      return "bg-gradient-to-r from-nintendo-dark to-nintendo-light text-white";
    case "steam":
      return "bg-gradient-to-r from-steam-dark to-steam-light text-white";
    case "pc":
      return "bg-gradient-to-r from-pc-dark to-pc-light text-white";
    case "mobile":
      return "bg-gradient-to-r from-mobile-dark to-mobile-light text-white";
    case "epic":
      return "bg-gradient-to-r from-epic-dark to-epic-light text-white";
    case "gog":
      return "bg-gradient-to-r from-gog-dark to-gog-light text-white";
    default:
      return "bg-gaming-gradient text-white";
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
