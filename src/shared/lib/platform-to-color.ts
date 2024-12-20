export function platformToBackgroundColor(platform: string) {
  if (platform.toLowerCase().includes("playstation")) {
    return "bg-playstation";
  }

  if (platform.toLowerCase().includes("xbox")) {
    return "bg-xbox";
  }

  if (platform.toLowerCase().includes("nintendo")) {
    return "bg-nintendo";
  }
}

export function platformToColorBadge(platform: string) {
  if (platform.toLowerCase().includes("playstation")) {
    return "text-playstation border-playstation bg-transparent";
  }

  if (platform.toLowerCase().includes("xbox")) {
    return "text-xbox border-xbox bg-transparent";
  }

  if (platform.toLowerCase().includes("nintendo")) {
    return "text-nintendo border-nintendo bg-transparent";
  }

  return "text-primary border-primary bg-transparent";
}
