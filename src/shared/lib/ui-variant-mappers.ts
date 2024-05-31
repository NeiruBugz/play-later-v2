const NINTENDO_PLATFORMS = [
  "wii u",
  "game boy advance",
  "wii",
  "game boy color",
  "game & watch",
  "nes",
];

export function platformEnumToColor(value: string) {
  const fromHLTB = value.toLowerCase();

  const platformMapping = {
    NINTENDO: "nintendo",
    PC: "pc",
    PLAYSTATION: "playstation",
    XBOX: "xbox",
  };

  const forHTLB = () => {
    for (const platform of Object.keys(platformMapping)) {
      if (fromHLTB.includes(platform.toLowerCase())) {
        return platformMapping[platform as keyof typeof platformMapping];
      }
    }
    if (NINTENDO_PLATFORMS.includes(fromHLTB)) {
      return platformMapping.NINTENDO;
    }
    return platformMapping.PC;
  };

  return platformMapping[value as keyof typeof platformMapping] || forHTLB();
}
