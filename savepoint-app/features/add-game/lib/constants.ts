export const platformOptions = [
  { value: "PlayStation 5", label: "PlayStation 5" },
  { value: "PlayStation 4", label: "PlayStation 4" },
  { value: "Xbox Series X|S", label: "Xbox Series X|S" },
  { value: "Xbox One", label: "Xbox One" },
  { value: "Nintendo Switch", label: "Nintendo Switch" },
  { value: "PC (Microsoft Windows)", label: "PC (Windows)" },
  { value: "Steam Deck", label: "Steam Deck" },
  { value: "Mac", label: "Mac" },
  { value: "Linux", label: "Linux" },
  { value: "iOS", label: "iOS" },
  { value: "Android", label: "Android" },
] as const;

export type SupportedPlatform = (typeof platformOptions)[number]["value"];
