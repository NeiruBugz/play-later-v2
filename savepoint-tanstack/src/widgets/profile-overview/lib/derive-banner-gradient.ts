function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function deriveBannerGradient(seed: string): string {
  const hash = hashString(seed);

  const hue1 = hash % 360;
  const hue2 = (hue1 + 40 + ((hash >> 8) % 60)) % 360;

  const lightness1 = 0.3 + ((hash >> 16) % 20) / 100;
  const lightness2 = 0.35 + ((hash >> 20) % 15) / 100;

  const chroma1 = 0.05 + ((hash >> 12) % 7) / 100;
  const chroma2 = 0.06 + ((hash >> 24) % 6) / 100;

  const stop1 = `oklch(${lightness1.toFixed(3)} ${chroma1.toFixed(3)} ${hue1})`;
  const stop2 = `oklch(${lightness2.toFixed(3)} ${chroma2.toFixed(3)} ${hue2})`;

  return `linear-gradient(135deg, ${stop1} 0%, ${stop2} 100%)`;
}
