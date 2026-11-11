export const COVER_TINT_CHROMA_CAP = 0.04;

export type CoverTint = { hue: number; chroma: number };

const MIN_LIGHTNESS = 0.18;
const MAX_LIGHTNESS = 0.95;
const MIN_CHROMA = 0.04;
const MIN_KEPT_SHARE = 0.08;
const BUCKET_DEGREES = 15;
const BUCKET_COUNT = 360 / BUCKET_DEGREES;
const BYTES_PER_PIXEL = 4;

type KeptPixel = { hue: number; chroma: number };

function decodeChannel(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function toOklch(
  red: number,
  green: number,
  blue: number
): { lightness: number; chroma: number; hue: number } {
  const r = decodeChannel(red);
  const g = decodeChannel(green);
  const b = decodeChannel(blue);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const hue = ((Math.atan2(bAxis, a) * 180) / Math.PI + 360) % 360;
  return { lightness, chroma: Math.hypot(a, bAxis), hue };
}

function median(values: number[]): number {
  const sorted = [...values].sort((x, y) => x - y);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
}

function bucketIndex(hue: number): number {
  return Math.floor(hue / BUCKET_DEGREES) % BUCKET_COUNT;
}

export function extractCoverTint(
  rgba: Uint8Array | Uint8ClampedArray
): CoverTint | null {
  const pixelCount = Math.floor(rgba.length / BYTES_PER_PIXEL);
  const buckets: KeptPixel[][] = Array.from({ length: BUCKET_COUNT }, () => []);
  let keptCount = 0;

  for (let pixel = 0; pixel < pixelCount; pixel++) {
    const offset = pixel * BYTES_PER_PIXEL;
    const { lightness, chroma, hue } = toOklch(
      rgba[offset]!,
      rgba[offset + 1]!,
      rgba[offset + 2]!
    );
    if (
      lightness < MIN_LIGHTNESS ||
      lightness > MAX_LIGHTNESS ||
      chroma < MIN_CHROMA
    ) {
      continue;
    }
    buckets[bucketIndex(hue)]!.push({ hue, chroma });
    keptCount++;
  }

  if (pixelCount === 0 || keptCount / pixelCount < MIN_KEPT_SHARE) return null;

  const bucketWeights = buckets.map((bucket) =>
    bucket.reduce((sum, pixel) => sum + pixel.chroma, 0)
  );
  const winner = bucketWeights.indexOf(Math.max(...bucketWeights));

  let sine = 0;
  let cosine = 0;
  for (const offset of [-1, 0, 1]) {
    const neighbourhood =
      buckets[(winner + offset + BUCKET_COUNT) % BUCKET_COUNT]!;
    for (const { hue, chroma } of neighbourhood) {
      const radians = (hue * Math.PI) / 180;
      sine += chroma * Math.sin(radians);
      cosine += chroma * Math.cos(radians);
    }
  }
  const meanHue = ((Math.atan2(sine, cosine) * 180) / Math.PI + 360) % 360;

  return {
    hue: Math.round(meanHue),
    chroma: median(buckets[winner]!.map((pixel) => pixel.chroma)),
  };
}
