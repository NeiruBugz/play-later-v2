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
